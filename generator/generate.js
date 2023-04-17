import { getRandomImageName } from "./util.js";
import { calculateRoyalties } from "./royalties.js";
import { sliceFrame, init as eInit } from "./effects/tartaria.js";
import {bismuthWrapper} from "./effects/bismuthDruse.js";
import {Stamper} from "./effects/stamper.js";
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
  let n_filler = 17;
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
  var mask = sketch.createGraphics(DIM, DIM);
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
  sketch.image(clone, 0, 0);
}

export function copyPasteImage(page, srcData, srcCoord, 
                    outWidth, outHeight, tgtRow=0, tgtCol=0) {
  if (srcCoord=="random"){
    var srcCol = Math.floor(random() * Math.max(0, (srcData.width - outWidth)));
    var srcRow = Math.floor(random() * Math.max(0, (srcData.height - outHeight)));
  }else{
    var srcCol = srcCoord.col * srcData.width;
    var srcRow = srcCoord.row * srcData.height;
  }
  page.copy(srcData, srcCol, srcRow, outWidth, outHeight,
                     tgtCol, tgtRow, outWidth, outHeight);
  return page;
}

// Receives:
// sketch: a p5js instance
// txn_hash: the transaction hash that minted this nft (faked in sandbox)
// random: a function to replace Math.random() (based on txn_hash)
// assets: an object with preloaded image assets from `export getAssets`, keyname --> asset
export async function draw(sketch, assets) {
  let startmilli = Date.now();

  //Fixed Canvas Size, change as needed
  WIDTH = 640;
  HEIGHT = 640;
  // Effect hyperparameters
  const verbose = true;      // how much to print
  const first_frame = 15;   // which frame of the simulation to start putting in the gif
  const last_frame = 25     // last frame of the simulation to put in the gif
  const configCode = 1;      // pre-configured setup ID
  const gif_repeat = 0;      // 0 for repeat, -1 for no-repeat
  const gif_frameDelay = 10;// frame delay in ms
  const gif_imgQuality = 10;

  let royalty_tally = {}
  //Populate the features object like so, it is automatically exported. 
  features['Trait Name'] = "Trait Value";

  console.log("---Processing Starting---");
  sketch.createCanvas(WIDTH, HEIGHT);
  try {
    /* Compute Crystal Growth Simulation For All Frames*/
    
    // (0) Setup GIF writer (put this in an above fcn?)
    let gif = new GIFEncoder(WIDTH, HEIGHT);
    gif.createReadStream().pipe(fs.createWriteStream('_demo_animation.gif'));
    gif.start();
    gif.setRepeat(gif_repeat);   
    gif.setDelay(gif_frameDelay);  
    gif.setQuality(gif_imgQuality); 

    // (1) Setup crystal effects
    let nFiller = Object.keys(assets).length - 1;
    let druse = bismuthWrapper(configCode, nFiller, HEIGHT, WIDTH, 
      last_frame);
    let stamp = new Stamper(assets)

    if (verbose)
      console.log("writing to gif now...")
    
    // Copy the Reference image to the main sketch (frame 0)
    var frameData = sketch.createGraphics(WIDTH, HEIGHT);
    frameData = copyPasteImage(frameData, assets["main_image"], "random", WIDTH, HEIGHT)
    sketch.image(frameData, 0, 0);
    // gif.addFrame(sketch.canvas.getContext('2d'));
    let frame_list = new Array()
    
    // Loop through the simulation history and draw on the canvas:
    for (let frameIdx = 1; frameIdx < last_frame; frameIdx++){
      // Stamp effects to frame
      let transient_frame = sketch.createGraphics(WIDTH, HEIGHT);
      transient_frame = stamp.stampFrame(transient_frame, druse, frameIdx);
      // Apply frame to canvas
      frame_list.push(transient_frame);
    }

    for (let frameIdx = first_frame; frameIdx < last_frame; frameIdx++){
      sketch.image(frame_list[frameIdx], 0, 0);
      gif.addFrame(sketch.canvas.getContext('2d')); // most expensive step of all
      }
    // for (let frameIdx = last_frame ; frameIdx <first_frame ; frameIdx--){
    //   sketch.image(frame_list[frameIdx], 0, 0);
    //   gif.addFrame(sketch.canvas.getContext('2d')); // most expensive step of all
    //   }
    
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
    // sketch.saveCanvas(sketch, "" + Math.floor(Math.random() * 10000), 'png');
    sketch.saveCanvas(sketch, "_demo_image.png");

    //Times how long the image takes to run
    console.log("---Processing Complete---")
    console.log("Time: " + (Date.now() - startmilli) / 1000 + " seconds");
    royalties = {
      "decimals": 3,
    }
    calculateRoyalties(royalties, royalty_tally)
    return sketch.getCanvasDataURL(sketch);
  } catch (e) {
    console.error(e);
  }
}
