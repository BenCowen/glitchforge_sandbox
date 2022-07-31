import { imageConfigDefault } from "next/dist/server/image-config.js";
import { addAuthorRoyalties } from "../royalties.js"
const AUTHOR_TEZOS_ADDRESS = "tz1heFSv4WcJ6AQR6xkPsp7jMsvCeEm11yrs"

export class BismuthCrystal{
    /* A Bismuth crystal is a block of constant image data
        that can GROW (in length, i.e. by copying itself in 
        to an offset position) or SPLIT into multiple other 
        crystals.
    */
   constructor(row, col, filler, direction, growProb, splitProb, overlap, showEdge){
    /* Inputs
       - row, column: integers indicating pixel location of the crystal center
                         with respect to the mother image
       - filler: a MxN array of image data to be copied in
       - direction: 2x1 unit vector indicating which direction for the crystal to grow
       - growProb: float in [0,1] indicating likelihood of growing
       - splitProb: float in [0,1] indicating likelihood of splitting
       - overlap: float in [0,1] indicating percentage of the minor radius to  use when growing
       - showEdge: boolean; if True, the outline/edge of the block is colored black
    */
    this.posHist   = [[row, col]];
    this.filler    = filler;
    this.direction = direction;
    this.growProb  = growProb;
    this.splitProb = splitProb;
    this.nrows     = this.filler.height;
    this.ncols     = this.filler.width;
    this.jumpSize  = Math.sqrt(this.nrows**2 + this.ncols**2) * (1-overlap);
    this.doEdge    = showEdge;
   }
   len(){
    return this.posHist.length;
   }
   currentPos(){
    return this.posHist[this.len() - 1]
   }
   grow(returnPos = false){
    /* Generate a new position and add it to the position history (postHist)
       Return the new position  history if requested.
    */
   let currPos  = this.currentPos()
   let rowShift = parseInt(currPos[0] * this.jumpSize)
   let colShift = parseInt(currPos[1] * this.jumpSize)
   let newPos   = [currPos[0]+rowShift, currPos[1]+colShift]
   this.posHist.push(newPos)
   }
   draw(sketch, idx, royalties){
    /* This draws filler onto the given sketch using the position
        from history index given by idx.
    */
    if (idx == -1)
        idx = this.len()
    // (0.a) Get the starting and ending rows:
    let rowCenter  = this.posHist[idx][0]   
    let halfHeight = Math.round(this.nrows/2)
    let rowSt      = Math.max(0, rowCenter - halfHeight)
    let rowFin     = Math.min(rowSt + this.nrows, sketch.height-1)
    let nrows      = Math.max(0, rowFin - rowSt)
    
    // (0.b) Get the starting and ending cols:
    let colCenter  = this.posHist[idx][0]   
    let halfWidth  = Math.round(this.ncols/2)
    let colSt      = Math.max(0, rowCenter - halfHeight)
    let colFin     = Math.min(colSt + this.ncols, sketch.width-1)
    let ncols      = Math.max(0, colFin - colSt)

    // (0.c) Error handling
    if (nrows<=0 || ncols<=0)
        return false

    // (1.a) Draw the filler into the canvas
    // sketch[rowSt:rowFin, colSt:colFin, :] = this.filler[:nrows, :ncols, :]
    sketch.copy(filler, rowSt, colSt, nrows, ncols, 0, 0, patchWidth, patchHeight);
    // (1.b) Highlight the edges with black if requested:
    // if (this.doEdge)
    //     sketch[rowSt:rowFin, colSt, :]  *= 0
    //     sketch[rowSt:rowFin, colFin, :] *= 0
    //     sketch[rowSt, colSt:colFin, :]  *= 0
    //     sketch[rowFin, colSt:colFin, :] *= 0

    return true

   }
}

/*
This should happen in a "batch-apply function" that draws everything.
addAuthorRoyalties(AUTHOR_TEZOS_ADDRESS, royalties);
*/