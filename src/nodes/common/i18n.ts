import { EditorRED } from 'node-red';
import pkg from '../../../package.json';
const name = pkg.name;

export type i18nParams = Record<string, string | number>;
export type i18nKeyandParams = string | [string, i18nParams];

declare const RED: EditorRED;

export const i18n = (id: string, args?: Record<string, string | number>) => {
  const namespace = `${pkg.name}/all`;
  let text = RED._(`${namespace}:${id}`, args);
  if (text.indexOf('\n') !== -1) {
    text = text
      .split('\n')
      .map((line) => `<p>${line}</p>`)
      .join('');
  }

  return text;
};
