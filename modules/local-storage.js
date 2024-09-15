const fs = require('fs');

class LocalStorage {
  async init() {
    if (await this.isStorageExist()) {
      const txt = await fs.promises.readFile('local-storage.json', { encoding: 'utf-8' });
      this.items = JSON.parse(txt);
    } else {
      this.items = {};
    }
  }

  getItem(key) {
    return this.items[key];
  }

  async setItem(key, value) {
    await this.writeItemsToLocalstorage();
    this.items[key] = value;
  }

  async removeItem(key) {
    await this.writeItemsToLocalstorage();
    delete this.items[key];
  }

  async clear() {
    await fs.promises.unlink('localStorage.json');
    this.items = {};
  }

  async writeItemsToLocalstorage() {
    await fs.promises.writeFile('localStorage.json', JSON.stringify(this.items, null, 2), { encoding: 'utf-8' });
  }

  async isStorageExist() {
    return fs.promises.access('localStorage.json', fs.constants.F_OK).then(() => true).catch(() => false);
  }
}

module.exports = new LocalStorage();
