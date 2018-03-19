const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage')();
const spawn = require('child-process-promise').spawn;

exports.generateThumbnail = functions.storage.object()
  .onChange(event => {
    const object = event.data;
    const filePath = object.name;
    const fileName = filePath.split('/').pop();
    const fileBucket = object.bucket;
    const tempFilePath = `/tmp/${fileName}`;

    if(fileName.startsWith('thumb_')) {
      console.log('Already a Thumbnail');
      return;
    }

    if(!object.contentType.startsWith('/image/')) {
      console.log('This is not an Image');
      return;
    }

    if(object.recourceState === 'not_exist') {
      console.log('This is a deletion event.');
      return;
    }

    return bucket.file(filePath).download({
      destination: tempFilePath
    })
    .then(() => {
      console.log('Image downloaded locally to', tempFilePath);
      spawn('convert', [tempFilePath, '-thumbnail', '200x200>', tempFilePath])
    })
    .then(() => {
      console.log('Thumbnail created');
      const thumbFilePath = filePath.replace(/(\/)?([^\/]*)$/, '$1thumb_$2')
    })
  })



/*
su pi -c 'node /home/pi/raspberry-licenceplate-detection/app.js < /dev/null &'
