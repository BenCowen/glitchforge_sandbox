import {copyPasteImage} from "../generate.js";

export class Stamper{
    constructor(assets){
        this.assets = assets;
    }
    
    stampFrame(frameData, druse, frameIdx, royalties){ 
        let frameData2;
        for (const crystal of druse.crystals.filter(druse.drawFilter(frameIdx))){
            frameData2 = this.stamp(frameData, crystal, frameIdx-crystal.firstFrame)
            if (frameData2 === undefined){
                let x=32;
                frameData2 = this.stamp(frameData, crystal, frameIdx-crystal.firstFrame)
            }
            frameData = frameData2;
        }
        return frameData;
    }
    stamp(frameData, crystal, crystalIndex){
        if (crystalIndex == -1) {crystalIndex = crystal.len()-1}
        // (0.a) Get the starting and ending rows:
        let [rowCenter, colCenter] = crystal.hist[crystalIndex].getXY()
        let halfPatch = Math.round(crystal.patchSize/2);
        let rowSt      = Math.max(0, rowCenter - halfPatch);
        let rowFin     = Math.min(rowSt + crystal.patchSize, frameData.height-1);
        let nrows      = Math.max(0, rowFin - rowSt);
        let offVert    = nrows<=0;

        // (0.b) Get the starting and ending cols:
        let colSt      = Math.max(0, colCenter - halfPatch);
        let colFin     = Math.min(colSt + crystal.patchSize, frameData.width-1);
        let ncols      = Math.max(0, colFin - colSt);
        let offHorz    = ncols<=0;

        // (1) Draw the filler into the canvas... but handle boundaries:
        if (offVert | offHorz){
            crystal.kill();
            return frameData;
        }else{
            return copyPasteImage(frameData, this.assets[crystal.fillerID],
                                  crystal.srcCoord, ncols, nrows, colSt, rowSt);
        }
    }
}