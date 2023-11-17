import { EditorNodeDef, EditorNodeProperties, EditorRED } from 'node-red';

import { EntityId, EntityShortId } from 'epdoc-node-red-hautil';
import EntitySelector from '../common/entity-selector';
import { FanControlInstruction, NodeColor } from './types';

declare const RED: EditorRED;

interface FanControlEditorNodeProperties extends EditorNodeProperties {
  entityId: EntityId;
  fan: EntityShortId;
  for: string;
  forUnits: string;
  instruction: FanControlInstruction;
  debugEnabled: boolean;
}

/**
 * This is inlined with HTML
 */
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
    fan: { value: '' },
    entityId: { value: '', required: true },
    instruction: { value: FanControlInstruction.TurnOn },
    debugEnabled: { value: false },
    for: { value: '0' },
    forUnits: { value: 'minutes' }
  },
  oneditprepare: function () {
    const entitySelector = new EntitySelector({
      entityId: this.entityId
    });
    $('#dialog-form').data('entitySelector', entitySelector);
  },
  oneditsave: function () {
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
