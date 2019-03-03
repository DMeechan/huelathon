require('dotenv').config();

const API_KEY = process.env.WATSON_API_KEY
console.log((API_KEY) ? "Found Watson API key" : "ERROR: Could not find Watson API key :(")

const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
const naturalLanguageUnderstanding = new NaturalLanguageUnderstandingV1({
  version: '2018-11-16',
  iam_apikey: API_KEY,
  url: 'https://gateway-lon.watsonplatform.net/natural-language-understanding/api'
});

function round(num) {
  return (Math.round(num * 100)) / 100;
}

function getRating(watsonScore) {
  const rating = (((watsonScore + 1) / 2) * 5);
  return round(rating);
}

function getParameters(text, target) {
  let response = {
    text, features: {}
  };

  response['features'][target] = {
    targets: text.split(' ')
  }

  return response;
}

async function getAnalysis(parameters) {
  return new Promise((resolve, reject) => {
    naturalLanguageUnderstanding.analyze(parameters, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
}

async function requestRating(text) {
  try {
    const parameters = getParameters(text, 'sentiment');
    const response = await getAnalysis(parameters);
    const score = response['sentiment']['document']['score'];
    if (!score) throw Error('emotion not found in Watson emotion response');
    return getRating(score);

  } catch (error) {
    return error;
  }
}

async function requestEmotions(text) {
  try {
    const parameters = getParameters(text, 'emotion');
    const response = await getAnalysis(parameters);
    const { emotion } = response.emotion.document
    if (!emotion) throw Error('emotion not found in Watson emotion response');

    // Normalize the emotion object
    for (let key in emotion) {
      if (emotion.hasOwnProperty(key)) {
        const value = emotion[key];
        emotion[key] = round(value);
      }
    }

    return emotion;

  } catch (error) {
    return error;
  }

}


const text = "I think this hackathon was pretty cool. Food was horrible.";
requestEmotions(text)
  .then(result => console.log(result))
  .catch(error => console.log(error));

module.exports = {
  requestRating, requestEmotions
}