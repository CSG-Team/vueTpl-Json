type Tag = {
    id?: string;
    value: string | number;
    style: Record<string, boolean>;
    tag: string;
  };
  type Data = Record<string, Tag | Tag[]>;
  
  type NormalLoadAttrType<T extends string> = {
    type: T;
    name: string;
    value: string;
  };
  type LoadAttrType =
    | NormalLoadAttrType<'String'>
    | NormalLoadAttrType<'VBind'>
    | Omit<NormalLoadAttrType<'VFor'>, 'name'>;
  type NormalContentType<T extends string> = {
    type: T;
    content: string;
  };
  type LoadContentType = NormalContentType<'text'> | NormalContentType<'exp'>;
  class ProcessTag {
    private tagStack: string[] = [];
    private contentStack: string[] = [];
    constructor(public tagName: string) {}
    loadAttr(loadTag: LoadAttrType) {
      const { type } = loadTag;
      switch (type) {
        case 'String': {
          this.tagStack.push(`${loadTag.name}="${loadTag.value}"`);
          break;
        }
        case 'VBind': {
          this.tagStack.push(`:${loadTag.name}="${loadTag.value}"`);
          break;
        }
        case 'VFor': {
          this.tagStack.push(`v-for="item in ${loadTag.value}"`);
          break;
        }
      }
    }
    loadContent(loadContent: LoadContentType) {
      const { type, content } = loadContent;
      switch (type) {
        case 'text': {
          this.contentStack.push(content);
          break;
        }
        case 'exp': {
          this.contentStack.push(`{{ ${content} }}`);
          break;
        }
      }
    }
    get startTag() {
      return `<${this.tagName}${this.tagStack.reduce(
        (p, c) => p + ' ' + c,
        ''
      )}>`;
    }
    get content() {
      return this.contentStack.join('');
    }
    get endTag() {
      return `</${this.tagName}>`;
    }
    get result() {
      return this.startTag + this.content + this.endTag;
    }
  }
  function createTag(name: string, tag: string) {
    const processTag = new ProcessTag(tag);
    processTag.loadAttr({
      type: 'VBind',
      name: 'style',
      value: `styleHelper(${name}.style)`,
    });
    processTag.loadContent({
      type: 'exp',
      content: `${name}.value`,
    });
    return processTag;
  }
  function createTemplate(data: Data) {
    const stack: string[] = [];
    stack.push('<template><div>');
    for (const [key, value] of Object.entries(data)) {
      const parentDiv = new ProcessTag('div');
      if (Array.isArray(value)) {
        parentDiv.loadAttr({
          type: 'VFor',
          value: key,
        });
        parentDiv.loadAttr({
          type: 'VBind',
          name: 'key',
          value: 'item.id',
        });
      }
      stack.push(parentDiv.startTag);
      let t: ProcessTag;
      if (Array.isArray(value)) {
        t = createTag('item', value[0].tag);
      } else {
        t = createTag(key, value.tag);
      }
      stack.push(t.result);
      stack.push(parentDiv.endTag);
    }
    stack.push('</div></template>');
    return stack.join('');
  }
  
  export { createTemplate, Data };
  export default createTemplate;
  