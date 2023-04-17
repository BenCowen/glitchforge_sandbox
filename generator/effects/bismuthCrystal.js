import {Vector} from "./geometry.js";

export class BismuthCrystal{
    /* A Bismuth crystal is a block of constant image data
        that can GROW (in length, i.e. by copying itself in 
        to an offset position) or SPLIT into multiple other 
        crystals.
    */
   constructor(seed, fillerID, srcCoord, patchSize, firstFrame, growProb, splitDelay, 
    splitProb, overlap, dirStep = 0, showEdge=false, boundaryCondition="kill"){
    /* Inputs
       - seed: Vector object denoting initial position and direction
       - filler: a MxN array of image data to be copied in
       - growProb: float in [0,1] indicating likelihood of growing
       - splitDelay: number of steps of growth before splitting is allowed
       - splitProb: float in [0,1] indicating likelihood of splitting
       - overlap: float in [0,1] indicating percentage of the minor radius to  use when growing
       - showEdge: boolean; if True, the outline/edge of the block is colored black
    */

    this.hist      = new Array(seed);
    this.srcCoord = srcCoord;
    this.firstFrame = firstFrame
    this.fillerID    = fillerID;
    this.growProb  = growProb;
    this.splitDelay = splitDelay;
    this.splitProb = splitProb;
    this.patchSize     = patchSize;
    this.boundaryCondition = boundaryCondition;
    // this.jumpSize  = Math.sqrt(Math.pow(this.nrows, 2) + Math.pow(this.ncols, 2)) * (1-overlap);
    this.jumpSize  = patchSize * overlap;
    this.dirStep = dirStep;
    this.doEdge    = showEdge;
    this.dead = false;
   }
   len(){
    return this.hist.length;
   }
   kill(){this.dead=true;}
   getXY(){
    return this.hist[this.len() - 1].getXY()
   }
   getDir(){
    return this.hist[this.len() - 1].getDir()
   }
   lastFrame(){
    return this.firstFrame + this.len()-1;
   }
   tryToSplit(frameIdx){
        if (frameIdx < this.firstFrame + this.splitDelay){
            return false;
        }
    return Math.random() < this.splitProb;
    }
   tryToGrow(){
    if (Math.random() < this.growProb){
        this.grow()
    }
   }
   grow(return_new = false, override = "no"){
    /* Generate a new position and add it to the position history
       Return the new position  history if requested.
    */
   if (override == "no"){
        var [row, col]    = this.getXY()
        var [dirX, dirY]  = this.getDir()
    } else{
        var [row, col]    = override.getXY()
        var [dirX, dirY]  = override.getDir()
    }
   let rowShift = Math.round(dirX * this.jumpSize)
   let colShift = Math.round(dirY * this.jumpSize)
   var newBlock   = new Vector(row+rowShift, col+colShift, dirX, dirY)
   if (this.dirStep>0 & (override!="no")){
        newBlock.rotate(this.dirStep)
    }
   if (return_new){
        return newBlock;
   } else{
        this.hist.push(newBlock);
        
   }
   
   }
}