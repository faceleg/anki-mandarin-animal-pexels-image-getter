const pexels = require('pexels')
const download = require('image-downloader');
const path = require('path')
const csv = require('csv-parser')
const fs = require('fs')

const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console({
    format: winston.format.simple(),
  })
  ],
});

function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
} 

const pexelsClient = pexels.createClient(process.env.API_KEY)

async function downloadPhoto(animal) {

  const photoName = animal.English
  const photoFileName = path.join(__dirname, 'images', `${photoName}-${animal.Mandarin}.jpg`) 

  // Check if the file exists
  if (fs.existsSync(photoFileName)) {
    // logger.info(`File exists at: ${photoFileName}`)
    return
  }

  const photoSearch = await pexelsClient.photos.search({ 
    query: photoName,
    orientation: 'landscape',
    size: 'medium'
  })

  if (photoSearch.photos.length < 1) {
    logger.error(`Cannot find image for ${photoName}`)
    await delay(2000)
    return;
  }

  const photoSrc = photoSearch.photos[0].src.large;
  await  download.image({
    url: photoSrc,
    dest: photoFileName,
    extractFilename: false
  })

}

const animals = [];

fs.createReadStream(path.join(__dirname, 'data', 'mandarin-animal-names.csv'))
  .pipe(csv())
  .on('data', (data) => animals.push(data))
  .on('end', async () => {
    for (const animal of animals) {
      await downloadPhoto(animal)
    }
  });

