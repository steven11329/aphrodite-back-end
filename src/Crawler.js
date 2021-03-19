export default class Crawler {
  constructor() {
    /**
     * @type {HTMLElement | null}
     */
    this.rootHtmlElement = null;
  }

  async crawl() {
    return null;
  }

  // eslint-disable-next-line no-unused-vars
  request(path) {
    return Promise.resolve(this.rootHtmlElement);
  }

  // eslint-disable-next-line no-unused-vars
  requestByFile(filePath) {
    return Promise.resolve(this.rootHtmlElement);
  }

  // eslint-disable-next-line no-unused-vars
  requestToFile(path, filePath) {
    return Promise.resolve(this.rootHtmlElement);
  }
}
