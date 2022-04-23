import type { Data } from './createTemplate';
import createTemplate from './createTemplate';
import HtmlParser from './HtmlParser';
const data: Data = {
  name: {
    value: 'byoungd',
    style: {
      bold: true,
      italic: true,
    },
    tag: 'p',
  },
  age: {
    value: 18,
    style: {
      bold: false,
      italic: true,
    },
    tag: 'h2',
  },
  skills: [
    {
      id: '0',
      value: 'Vue',
      style: {
        bold: true,
        italic: false,
      },
      tag: 'span',
    },
    {
      id: '1',
      value: 'React',
      style: {
        bold: true,
        italic: false,
      },
      tag: 'span',
    },
    {
      id: '2',
      value: 'Rust',
      style: {
        bold: false,
        italic: true,
      },
      tag: 'span',
    },
  ],
};
const html = `<div class="oh wow" wow='hei' test>
  wow <!--123-->
  <p style="color: red;">
    hi <!-- wow --><h1>test h1</h1>
  </p>
  <img/>
</div>`;

const parser = new HtmlParser();
const parseResult = parser.parser(html);
console.log(parseResult);
const templateResult = createTemplate(data);
console.log(templateResult);
