const fs = require('fs');
const path = require('path');
const Downloader = require('nodejs-file-downloader');
const config = require('../../../config');

function getAllMediaContentLinks(data) {
  // Check if the structure matches what we expect
  if (
    data &&
    data.schedule &&
    data.schedule.medias &&
    Array.isArray(data.schedule.medias.data)
  ) {
    // Extract the content links from each media object
    return data.schedule.medias.data
      .filter((item) => item && item.media && item.media.content)
      .map((item) => item.media.content);
  }

  // If the structure isn't as expected, return an empty array
  return [];
}

const onScheduleEventInterceptor = async (outgoingPayload) => {
  const contentLinks = getAllMediaContentLinks(outgoingPayload.data);

  if (!contentLinks.length) {
    return outgoingPayload;
  }

  const STORAGE_DIR = path.resolve(__dirname, '..', '..', '..', '..', `storage${process.env.INSTANCE_ID ? `-${process.env.INSTANCE_ID}` : ''}`);

  const isStorageDirExists = await fs.promises.access(STORAGE_DIR, fs.constants.F_OK).then(() => true).catch(() => false);

  if (!isStorageDirExists) {
    await fs.promises.mkdir(STORAGE_DIR, { recursive: true });
  }

  const existingFilesInStorage = await fs.promises.readdir(STORAGE_DIR);

  const contentFileNames = contentLinks.map((link) => {
    const urlParts = link.split('/');
    return urlParts[urlParts.length - 1];
  });

  const missingFiles = contentFileNames.filter((fileName) => !existingFilesInStorage.includes(fileName));

  if (missingFiles.length) {
    for (const missingFile of missingFiles) {
      const fileUrl = contentLinks.find((link) => link.includes(missingFile));

      if (fileUrl) {
        const downloader = new Downloader({
          url: fileUrl,
          directory: STORAGE_DIR,
          fileName: missingFile,
          cloneFiles: false,
        });

        try {
          await downloader.download();
          console.log(`Downloaded ${missingFile}`);
        } catch (error) {
          console.error(`Failed to download ${missingFile}: ${error.message}`);
        }
      }
    }
  }

  if (config.WS_PORT) {
    // replace the content links with the local file paths
    const baseServerUrl = `http://localhost:${config.WS_PORT}/storage${process.env.INSTANCE_ID ? `-${process.env.INSTANCE_ID}` : ''}`;

    outgoingPayload.data.schedule.medias.data.forEach((item) => {
      if (item.media && item.media.content) {
        const urlParts = item.media.content.split('/');
        const fileName = urlParts[urlParts.length - 1];
        item.media.content = `${baseServerUrl}/${fileName}`;
      }
    });
  }

  return outgoingPayload;
};

module.exports = {
  onScheduleEventInterceptor,
};
