const fs = require('fs');

class LocalStorage {
  constructor() {
    this.items = {};
    this.filename = `local-storage${process.env.INSTANCE_ID ? process.env.INSTANCE_ID : ''}.json`;
  }

  async init() {
    if (await this.isStorageExist()) {
      const txt = await fs.promises.readFile(this.filename, { encoding: 'utf-8' });
      this.items = JSON.parse(txt);
    } else {
      this.items = {};
      await this.writeItemsToLocalstorage();
    }
  }

  getItem(key) {
    return this.items[key];
  }

  async setItem(key, value) {
    this.items[key] = value;
    await this.writeItemsToLocalstorage();
  }

  async removeItem(key) {
    delete this.items[key];
    await this.writeItemsToLocalstorage();
  }

  async clear() {
    await fs.promises.unlink(this.filename);
    this.items = {};
  }

  async writeItemsToLocalstorage() {
    await fs.promises.writeFile(this.filename, JSON.stringify(this.items, null, 2), { encoding: 'utf-8', flag: 'w' });
  }

  async isStorageExist() {
    return fs.promises.access(this.filename, fs.constants.F_OK).then(() => true).catch(() => false);
  }
}

module.exports = new LocalStorage();
