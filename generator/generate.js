import { getRandomImageName } from "./util.js";
import { calculateRoyalties } from "./royalties.js";
import { sliceFrame, init as eInit } from "./effects/tartaria.js";
import {BismuthDruse} from "./effects/bismuthDruse.js";
import {crystalConfig} from "./effects/aux_classes.js";
import GIFEncoder from 'gifencoder';
import fs from 'fs';
import pkg from 'canvas';

const { createCanvas, loadImage } = pkg;
var r; //assign random hash accees
var WIDTH; var HEIGHT;
var random = null;
var royalties;

// Guaranteed to be called first.
export function init(rnd, txn_hash) {
  Math.random = rnd;
  random = rnd;
  eInit(rnd);
}

// Guaranteed to be called second (after init), to load required assets.
// Returns a map of assets, keyname --> filename
export function getAssets(raw_assets) {
  let assets = [["main_image", getRandomImageName(raw_assets, 'samples')]]
  let n_filler = 10;
  for (let f=0; f<n_filler; f++){
      assets.push(["filler"+f, getRandomImageName(raw_assets, 'samples')]);
  }
  return assets
}

// Guaranteed to be called after setup(), can build features during setup
// Add your rarity traits and attributes to the features object
const features = {};
export function getFeatures() {
  return features;
}
export function getMetadata() {
  return {
    "features": features,
    "royalties": royalties
  }
}
/*
  Get a random number between a and b
*/
function rbtw(a, b, random) {
  return a + (b - a) * random();
}


function getMask(DIM) {
  var mask = p5js.createGraphics(DIM, DIM);
  mask.noStroke();
  mask.fill(255, 255, 255, 255);
  return mask;
}
/*
  Apply a mask, used for cutting shapes out of one canvas 
  and pasting them onto another.
*/
function applyMask(source, target) {
  let clone;
  (clone = source.get()).mask(target.get());
  p5js.image(clone, 0, 0);
}

export function returnCroppedCopy(p5js, srcData, style, outWidth, outHeight, row=0, col=0) {
  if (style=="random"){
    var copyStartX = Math.floor(random() * (srcData.width - outWidth));
    var copyStartY = Math.floor(random() * (srcData.height - outHeight));
  }
  var newImg = p5js.createGraphics(outWidth, outHeight);
  newImg.copy(srcData, copyStartX, copyStartY, outWidth, outHeight,
                              row,        col, outWidth, outHeight)
  return newImg
}

// Receives:
// p5js: a p5js instance
// txn_hash: the transaction hash that minted this nft (faked in sandbox)
// random: a function to replace Math.random() (based on txn_hash)
// assets: an object with preloaded image assets from `export getAssets`, keyname --> asset
export async function draw(p5js, assets) {
  let startmilli = Date.now();

  //Fixed Canvas Size, change as needed
  WIDTH = 640;
  HEIGHT = 640;

  let royalty_tally = {}
  //Populate the features object like so, it is automatically exported. 
  features['Trait Name'] = "Trait Value";

  console.log("---Processing Starting---");
  p5js.createCanvas(WIDTH, HEIGHT);
  var gif_ctx = createCanvas(WIDTH, HEIGHT).getContext('2d')
  try {
    // (0.0) Setup GIF writer (put this in an above fcn?)

    // const canvass = createCanvas(WIDTH, HEIGHT);
    // const ctx = canvass.getContext('2d');
    // const gif_ctx = p5js.createCanvas(WIDTH, HEIGHT).getContext('2d'); //GIF canvas...
    let n_frames = 5;
    let gif = new GIFEncoder(WIDTH, HEIGHT);
    gif.setRepeat(0);   // 0 for repeat, -1 for no-repeat
    gif.setDelay(10);  // frame delay in ms
    gif.setQuality(1); // image quality. 10 is default.
    // later, this gets set above...
    const output_file = fs.createWriteStream('animation1.gif');
    gif.createWriteStream().pipe(output_file);
    gif.start();
    let verbose = true 
    // (1.0) Import Data to desired size
    let canvas = returnCroppedCopy(p5js, assets["main_image"], "random", WIDTH, HEIGHT)
    // Copy the Reference image to the main p5js for manipulation
    p5js.image(canvas, 0, 0);
    
    // (2) Setup crystal effects
    let config_code = 0
    let baseConfig = new crystalConfig().getCommonConfig(config_code)
    // Crystal children will behave differently:
    let splitConfig = new crystalConfig().getCommonConfig(config_code)
    splitConfig.splitProb = 0.1
    splitConfig.patchSizeFactor = 0.25

    // (3) Set up secondary sources (filler imagery)
    let druse  = new BismuthDruse(p5js, baseConfig, splitConfig, assets)
    console.log("_______________")
    
    
    if (verbose)
      console.log("Starting to grow for " + n_frames + " steps...")

    /*Grow in a separate loop from writing cuz there's non-causal effects*/
    for (let step = 0; step < n_frames; step++){
      console.log('ncrystal = '+druse.len())
      druse.growCrystals();
    }

    if (verbose)
      console.log("writing to gif now...")
    let image_url, image_data;
    for (let step = 0; step < n_frames; step++){
      druse.drawCrystals(step);
      image_url = druse.p5.getCanvasDataURL(druse.p5);
      image_data = await loadImage(image_url);
      gif_ctx.drawImage(image_data, 0, 0);
      gif.addFrame(gif_ctx); // this step takes forever!
    }
    
    // finish feeding frames and create GIF
    gif.finish();
    /***********IMAGE MANIPULATION ENDS HERE**********/



    /* HELPFUL DEBUG CODE
      -Display original source image in top right, 
      -Used to compare the original with added effects.
      -Comment this out before production. 
    */
    // sk.copy(G["ref"], 0, 0, DIM, DIM, DIM - DIM / 5, 0, DIM / 5, DIM / 5,);


    //Saves the image for test review: Remove from production
    p5js.saveCanvas(p5js, "" + Math.floor(Math.random() * 10000), 'png');

    //Times how long the image takes to run
    console.log("---Processing Complete---")
    console.log("Time: " + (Date.now() - startmilli) / 1000 + " seconds");
    royalties = {
      "decimals": 3,
    }
    calculateRoyalties(royalties, royalty_tally)
    return p5js.getCanvasDataURL(p5js);
  } catch (e) {
    console.error(e);
  }
}
