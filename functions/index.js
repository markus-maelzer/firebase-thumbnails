const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage')();
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');

exports.generateThumbnail = functions.storage.object()
  .onChange(event => {
    const object = event.data;

    const fileBucket = object.bucket;
    const filePath = object.name;
    const contentType = object.contentType;
    const resourceState = object.resourceState;
    const metageneration = object.metageneration;

    if (!contentType.startsWith('image/')) {
      console.log('This is not an image.');
      return null;
    }

    const fileName = path.basename(filePath);
    if(fileName.startsWith('thumb_')) {
      console.log('Already a Thumbnail');
      return null;
    }

    if (resourceState === 'not_exists') {
      console.log('This is a deletion event.');
      return null;
    }
    if (resourceState === 'exists' && metageneration > 1) {
      console.log('This is a metadata change event.');
      return null;
    }

    const tempFilePath = path.join(os.tmpdir(), fileName);
    const bucket = gcs.bucket(fileBucket);
    const metadata = {
      contentType: contentType,
    };


    return bucket.file(filePath).download({
      destination: tempFilePath,
    }).then(() => {
      console.log('Image downloaded locally to', tempFilePath);
      return spawn('convert', [tempFilePath, '-thumbnail', '300x300>', tempFilePath]);
    })
    .then(() => {
      console.log('Thumbnail created at', tempFilePath);
      const thumbFileName = `thumb_${fileName}`;
      const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
      // Uploading the thumbnail.
      return bucket.upload(tempFilePath, {
        destination: thumbFilePath,
        metadata: metadata,
      });
    }).then(() => fs.unlinkSync(tempFilePath));
  })
