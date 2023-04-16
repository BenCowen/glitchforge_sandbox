import {Position, Direction, crystalConfig } from "./aux_classes.js";
import {returnCroppedCopy} from "../generate.js";
import { imageConfigDefault } from "next/dist/server/image-config.js";
import { addAuthorRoyalties } from "../royalties.js"
const AUTHOR_TEZOS_ADDRESS = "tz2RTukHBKaDs4dWgYQATddt4ZgMjy5DwLxv"

class BismuthCrystal{
    /* A Bismuth crystal is a block of constant image data
        that can GROW (in length, i.e. by copying itself in 
        to an offset position) or SPLIT into multiple other 
        crystals.
    */
   constructor(row, col, filler, fillerSize, direction, growProb, 
    splitProb, overlap, showEdge, boundaryCondition="kill"){
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
    this.posHist   = new Array(new Position(row,col));
    this.filler    = filler;
    this.direction = direction;
    this.growProb  = growProb;
    this.splitProb = splitProb;
    this.nrows     = fillerSize;
    this.ncols     = fillerSize;
    this.boundaryCondition = boundaryCondition;
    // this.jumpSize  = Math.sqrt(Math.pow(this.nrows, 2) + Math.pow(this.ncols, 2)) * (1-overlap);
    this.jumpSize  = Math.min(this.nrows, this.ncols ) * overlap;
    this.doEdge    = showEdge;
   }
   len(){
    return this.posHist.length;
   }
   currentPos(){
    return this.posHist[this.len() - 1]
   }
   grow(){
    /* Generate a new position and add it to the position history (postHist)
       Return the new position  history if requested.
    */
   let currPos  = this.currentPos()
   let rowShift = Math.round(this.direction.x * this.jumpSize)
   let colShift = Math.round(this.direction.y * this.jumpSize)
   let newPos   = new Position(currPos.row+rowShift, currPos.col+colShift)
   this.posHist.push(newPos)
   }
   draw(sketch, idx, royalties){
    /* This draws filler onto the given sketch using the position
        from history index given by idx.
    */
    if (idx == -1) {idx = this.len()}

    // (0.a) Get the starting and ending rows:
    let rowCenter  = this.posHist[idx].row;
    let halfHeight = Math.round(this.nrows/2);
    let rowSt      = Math.max(0, rowCenter - halfHeight);
    let rowFin     = Math.min(rowSt + this.nrows, sketch.height-1);
    let nrows      = Math.max(0, rowFin - rowSt);
    let offVert    = nrows<0;
    
    // (0.b) Get the starting and ending cols:
    let colCenter  = this.posHist[idx].col;
    let halfWidth  = Math.round(this.ncols/2);
    let colSt      = Math.max(0, colCenter - halfWidth);
    let colFin     = Math.min(colSt + this.ncols, sketch.width-1);
    let ncols      = Math.max(0, colFin - colSt);
    let offHorz    = ncols<0;


    // (1) Draw the filler into the canvas... but handle boundaries:
        // Edge Handling
    if (offVert | offHorz){
        if (this.boundary_condition == "kill"){
            this.growProb = 0;
            return sketch;
        }else{
            sketch.copy(this.filler,  0,      0, nrows, ncols, 
                rowSt,  colSt, nrows, ncols);
        }
    }
    
    sketch.updatePixels();
    //(1.b) Highlight the edges with black if requested:
    // if (this.doEdge)
    //     sketch[rowSt:rowFin, colSt, :]  *= 0
    //     sketch[rowSt:rowFin, colFin, :] *= 0
    //     sketch[rowSt, colSt:colFin, :]  *= 0
    //     sketch[rowFin, colSt:colFin, :] *= 0

    return sketch;

   }
}

/*
This should happen in a "batch-apply function" that draws everything.
addAuthorRoyalties(AUTHOR_TEZOS_ADDRESS, royalties);
*/

export class BismuthDruse{
    /* Manages a collection of Bismuth crystals*/
   constructor(p5js, baseConfig, splitConfig, fillerLib){
    this.p5 = p5js
    this.crystals    = new Array();
    this.baseConfig  = baseConfig;
    this.splitConfig = splitConfig;
    this.fillerLib = fillerLib
    this.initAxes()
    this.newCrystal(0)
}

len(){
    return this.crystals.length;
   }
newCrystal(fillerID, config = "none", fromSplit = false, startPoint = "none", 
            direction = "none", lastPatchSize = "none"){
    /* Parse Config */
    if (config == "none"){
        config = this.baseConfig;
    } else if (fromSplit){
        config = this.splitConfig;
    }
    /* Check for startPoint override */
    if (startPoint == "none"){
        startPoint = config.startPoint;
    }
    /* PatchSize may shrink if this is a splitting crystal*/
    if (lastPatchSize != "none"){
        var patchSize = config.patchSize;
        patchSize.row = config.patchSizeFactor * lastPatchSize.row;
        patchSize.col = config.patchSizeFactor * lastPatchSize.col;
    } else{
        var patchSize = config.patchSize;
    }
    /* Parse Direction*/
    if (direction == "none"){
        if (config.dirStyle == "cartesian"){
            direction = this.randomAlongAxisDir()
        } else{
            direction = this.randomDir()
        }
    } 
    /* Create the new Crystal */
    let filler = this.getPatch(fillerID, startPoint, patchSize)
    this.crystals.push(new BismuthCrystal(startPoint.row, startPoint.col, 
                                          filler, patchSize, direction, config.growProb, 
                                          config.splitProb, config.overlap, config.showEdge)
    )
    return ;
}

growCrystals(){
    for (let crystalID = 0; crystalID < this.len(); crystalID++){
        if (Math.random() < this.crystals[crystalID].growProb){
            this.crystals[crystalID].grow()
        }
    }
}

drawCrystals(index){
    for (let crystalID = 0; crystalID < this.len(); crystalID++){
        this.p5 = this.crystals[crystalID].draw(this.p5, index)
        }
    }

randomDir(){
    return new Direction(Math.random() - 0.5, Math.random() - 0.5).normalize();
}

initAxes(style="cartesian"){
    if (style=="cartesian"){
        this.axisVec = new Direction(0, 1).normalize()
    }
}
randomAlongAxisDir(){
    /* Random orthonormal basis vector*/    
    let theta = Math.round(Math.random() * 3) * Math.PI / 180.0
    let new_x = this.axisVec.x * Math.cos(theta) - this.axisVec.y * Math.sin(theta)
    let new_y = this.axisVec.x * Math.cos(theta) + this.axisVec.y * Math.sin(theta)
    return new Direction(new_x, new_y).normalize();
}
getPatch(fillerID, startPoint, patchSize){
    //slice a patch from source image
    return returnCroppedCopy(this.p5, this.fillerLib["filler"+fillerID], 
                             "random", patchSize, patchSize, startPoint.row, startPoint.col);
}

}