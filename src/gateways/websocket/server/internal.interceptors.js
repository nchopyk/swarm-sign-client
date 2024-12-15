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

  const existingFilesInStorage = await fs.promises.readdir(path.resolve(__dirname, '..', '..', '..', '..', 'storage'));

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
          directory: path.resolve(__dirname, '..', '..', '..', '..', 'storage'),
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
    const baseServerUrl = `http://localhost:${config.WS_PORT}/storage`;

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
