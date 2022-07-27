import { imageConfigDefault } from "next/dist/server/image-config.js";
import { addAuthorRoyalties } from "../royalties.js"


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
    this.nrows, this.ncols = this.filler.shape();
    this.jumpSize  = sqrt(this.nrows**2 + this.ncols**2) * (1-overlap);
    this.doEdge    = showEdge;
   }
   len(){
    return this.posHist.length;
   }
   currentPos(){
    return this.posHist[colors.length - 1]
   }
   grow(returnPos = false){
    /* Generate a new position and add it to the position history (postHist)
       Return the new position  history if requested.
    */
   let currPos  = this.posHist[colors.length - 1]
   let rowShift = parseInt(currPos[0] * this.jumpSize)
   let colShift = parseInt(currPos[1] * this.jumpSize)
   let newPos   = [currPos[0]+rowShift, currPos[1]+colShift]
   this.posHist.push(newPos)
   }
   draw(canvas, idx){
    /* This draws filler onto the given canvas using the position
        from history index given by idx.
    */
    if (idx == -1)
        idx = this.posHist.length - 1
    // (0.a) Get the starting and ending rows:
    let rowCenter  = this.posHist[idx][0]   
    let halfHeight = round(self.nrows/2)
    let rowSt      = max(0, rowCenter - halfHeight)
    let rowFin     = min(rowSt + this.nrows, canvas.shape[0]-1)
    let nrows      = max(0, rowFin - rowSt)
    
    // (0.b) Get the starting and ending cols:
    let colCenter  = this.posHist[idx][0]   
    let halfWidth  = round(self.ncols/2)
    let colSt      = max(0, rowCenter - halfHeight)
    let colFin     = min(colSt + this.ncols, canvas.shape[1]-1)
    let ncols      = max(0, colFin - colSt)

    // (0.c) Error handling
    if (nrows<=0) or (ncols<=0)
        return canvas, false

    // (1.a) Draw the filler into the canvas
    // canvas[rowSt:rowFin, colSt:colFin, :] = self.filler[:nrows, :ncols, :]
    
    // (1.b) Highlight the edges with black if requested:
    // if (this.doEdge)
    //     canvas[rowSt:rowFin, colSt, :]  *= 0
    //     canvas[rowSt:rowFin, colFin, :] *= 0
    //     canvas[rowSt, colSt:colFin, :]  *= 0
    //     canvas[rowFin, colSt:colFin, :] *= 0

    return image, True

   }
}


