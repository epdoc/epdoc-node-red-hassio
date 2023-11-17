import { EntityType } from './../common/const';
import { EditorNodeDef, EditorNodeProperties, EditorRED } from 'node-red';

import { TransformType } from '../../common/TransformState';
import { ComparatorType, EntityType, NodeType, TypedInputTypes } from '../../const';
import EntitySelector from '../../editor/components/EntitySelector';
import * as ifState from '../../editor/components/ifstate';
import * as haOutputs from '../../editor/components/output-properties';
import * as exposeNode from '../../editor/exposenode';
import * as haServer from '../../editor/haserver';
import { OutputProperty } from '../../editor/types';
import { saveEntityType } from '../entity-config/editor/helpers';
import { EntityShortId } from 'epdoc-node-red-hautil';
import { Integer } from 'epdoc-util';
import { NodeColor } from './types';

declare const RED: EditorRED;

interface FanControlEditorNodeProperties extends EditorNodeProperties {
  server: string;
  version: number;
  exposeAsEntityConfig: string;
  entityId: string | string[];
  entityIdType: string;
  for: string;
  forType: string;
  forUnits: string;
  outputProperties: OutputProperty[];

  fan: EntityShortId;
  service: 'on' | 'off';
  speed: Integer;
  timeout: Integer;
  debug: boolean;
}

const FanControlEditor: EditorNodeDef<FanControlEditorNodeProperties> = {
  category: 'function', //'home_assistant',
  color: NodeColor.HaBlue,
  inputs: 1,
  outputs: 2,
  outputLabels: ['done', 'call service'],
  icon: 'fan.svg',
  paletteLabel: 'Fan Control',
  label: function () {
    return this.name || `state_changed: ${this.entityId || 'all entities'}`;
  },
  labelStyle: 'node_label_italic',
  defaults: {
    name: { value: '' },
    server: { value: '', type: NodeType.Server, required: true },
    version: { value: RED.settings.get('serverStateChangedVersion', 0) },
    fan: { value: '' },
    entityId: { value: '', required: true },
    service: { value: 'off' },
    speed: { value: 2, validate: RED.validators.regex(/^[0-6]$/) },
    debug: { value: false },
    outputs: { value: 1 },
    exposeAsEntityConfig: {
      value: '',
      type: NodeType.EntityConfig,
      // @ts-ignore - DefinitelyTyped is missing this property
      filter: (config) => config.entityType === EntityType.Switch,
      required: false
    },
    entityIdType: { value: 'exact' },
    for: { value: '0' },
    forType: { value: 'num' },
    forUnits: { value: 'minutes' }
  },
  oneditprepare: function () {
    ha.setup(this);
    haServer.init(this, '#node-input-server', (serverId) => {
      entitySelector.serverChanged(serverId);
    });
    exposeNode.init(this);
    saveEntityType(EntityType.Switch, 'exposeAsEntityConfig');

    const entitySelector = new EntitySelector({
      filterTypeSelector: '#node-input-entityIdType',
      entityId: this.entityId,
      serverId: haServer.getSelectedServerId()
    });
    $('#dialog-form').data('entitySelector', entitySelector);

    ifState.init('#node-input-ifState', '#node-input-ifStateType', '#node-input-ifStateOperator');

    $('#node-input-for').typedInput({
      default: 'num',
      types: ['num', 'jsonata', 'flow', 'global'],
      typeField: '#node-input-forType'
    });

    haOutputs.createOutputs(this.outputProperties, {
      extraTypes: ['eventData', 'entityId', 'entityState']
    });
  },
  oneditsave: function () {
    const outputs = $('#node-input-ifState').val() ? 2 : 1;
    $('#node-input-outputs').val(outputs);
    this.outputProperties = haOutputs.getOutputs();
    const entitySelector = $('#dialog-form').data('entitySelector') as EntitySelector;
    this.entityId = entitySelector.entityId;
    entitySelector.destroy();
  },
  oneditcancel: function () {
    const entitySelector = $('#dialog-form').data('entitySelector') as EntitySelector;
    entitySelector.destroy();
  }
};

export default FanControlEditor;
