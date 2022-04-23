type HTMLTags = keyof HTMLElementTagNameMap;
type Shape = { shape: string[] };
type TextDom = {
  type: 'text';
  content: string;
} & Shape;
type CommentDom = {
  type: 'comment';
  content: string;
} & Shape;
type HtmlDom = {
  type: 'tag';
  name: HTMLTags;
  attrs: Record<string, string>;
  voidElement: boolean;
  children: VDom[];
} & Shape;

type RootDom = {
  type: 'root';
  children: VDom[];
};

export type VDom = TextDom | CommentDom | HtmlDom;

type Tag = {
  type: 'tag';
  content: string;
};
type Content = {
  type: 'content';
  content: string;
};

class HtmlParser {
  private i = 0;
  private html = '';
  private stack!: [RootDom, ...HtmlDom[]];
  private shape: string[][] = [];
  private init(html: string) {
    const rootDom: RootDom = {
      type: 'root',
      children: [],
    };
    this.i = 0;
    this.stack = [rootDom];
    this.shape = [];
    this.html = html;
  }
  private get n() {
    return this.html.length;
  }
  private get current() {
    return this.stack.at(-1) as HtmlDom;
  }
  private get flatShape() {
    return this.shape.flat(1);
  }
  private getTag(start: number): Tag {
    let tagContent = '';
    let i = start;
    while (this.html[i] !== '>' && i < this.n) {
      tagContent += this.html[i++];
    }
    if (
      tagContent.startsWith('/') &&
      tagContent.slice(1) !== this.current.name
    ) {
      throw new SyntaxError(
        `<${tagContent}> attempted to close an element that was not open`
      );
    }
    if (this.i === this.n) {
      throw new SyntaxError(`<${this.current.name}> left open`);
    }
    this.i = i + 1;
    return { content: tagContent, type: 'tag' };
  }
  private parseTag(content: string) {
    const voidElement = content.endsWith('/');
    if (voidElement) content = content.slice(0, -1);
    const attrs: Record<string, string> = {};
    const attrReg = / (?<attrName>\w*?)=(['"])(?<attrValue>.*?)\2/g;
    content = content.replace(attrReg, (...args) => {
      const { attrName, attrValue } = args.at(-1) as {
        attrName: string;
        attrValue: string;
      };
      attrs[attrName] = attrValue;
      return '';
    });
    const [name, ...attrNames] = content.split(' ') as [HTMLTags, ...string[]];
    attrNames.forEach((attrName) => {
      attrs[attrName] = 'true';
    });
    this.shape.push([name, ...(attrs['style'] ? [attrs['style']] : [])]);
    const vDom: HtmlDom = {
      type: 'tag',
      name,
      attrs,
      voidElement,
      shape: this.flatShape,
      children: [],
    };
    this.stack.push(vDom);
    return vDom;
  }
  private getContent(start: number): Content {
    let innerHtml = '';
    let i = start;
    while ((this.html[i] !== '<' || this.html[i + 1] === '!') && i < this.n) {
      innerHtml += this.html[i++];
    }
    if (this.i === this.n) {
      throw new SyntaxError('Unexpected end of input');
    }
    this.i = i;
    return { content: innerHtml, type: 'content' };
  }
  private *parseContent(content: string) {
    const splitCommentReg = /(?:<!--)(.*?)(?:-->)/;
    const contents = content.split(splitCommentReg);
    for (let i = 0, n = contents.length; i < n; i += 2) {
      const textContent = contents[i];
      if (textContent !== '') {
        const textDom: TextDom = {
          type: 'text',
          content: textContent,
          shape: this.flatShape,
        };
        yield textDom;
      }
      const commentContent = contents[i + 1] ?? '';
      if (commentContent !== '') {
        const commentDom: CommentDom = {
          type: 'comment',
          content: commentContent,
          shape: this.flatShape,
        };
        yield commentDom;
      }
    }
  }
  private *parse() {
    while (this.i < this.n) {
      const ch = this.html[this.i];
      if (ch === '<') {
        yield this.getTag(this.i + 1);
      } else {
        yield this.getContent(this.i);
      }
    }
  }
  private leave() {
    const res = this.stack.pop() as HtmlDom;
    this.shape.pop();
    this.current.children.push(res);
    return res;
  }
  parser(html: string) {
    this.init(html);

    for (const parseRes of this.parse()) {
      const { content, type } = parseRes;
      if (type === 'tag') {
        if (content.startsWith('/')) {
          this.leave();
        } else {
          const vDom = this.parseTag(content);
          if (vDom.voidElement) {
            this.leave();
          }
        }
      } else {
        for (const otherDom of this.parseContent(content)) {
          this.current.children.push(otherDom);
        }
      }
    }
    return this.stack.pop()!;
  }
}

export { HtmlParser };
export default HtmlParser;
