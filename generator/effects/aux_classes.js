
export class Position{
    constructor(row, column){
        this.row = row
        this.col = column
    }
}
export class Direction{
    constructor(x, y){
        this.x = x
        this.y = y
    }
    normalize(){
        let mag = Math.sqrt(this.x**2+this.y**2)
        this.x = this.x/mag;
        this.y = this.y/mag;
        return this
    }
}


export class crystalConfig{
    /* Manages a collection of Bismuth crystals*/
   constructor(startPoint = "none", dirStyle = "cartestian", overlap = 0.05, 
               patchSize = 0.175, growProb = 1, splitProb = 0.25, nSplits = 2,
               highlightEdges = false, separationAngle = 180, patchSizeFactor = 1,
               config_code="none"){

        if (config_code != "none"){
            this.getCommonConfig(config_code)
        } else{
            this.startPoint = startPoint
            this.dirStyle  = dirStyle
            this.overlap    = overlap
            this.patchSize  = patchSize
            this.growProb   = growProb
            this.splitProb  = splitProb
            this.nSplits    = nSplits
            this.doEdges    = highlightEdges
            this.sepAng     = separationAngle
            this.patchSizeFactor = patchSizeFactor
        }
   }
   getCommonConfig(config_code){
    if (config_code==0){
    // Initial Crystal:
    let row        = 200;
    let col        = 200;
    let startPoint = new Position(row,col)
    let direction  = new Direction(0.707106781, -0.707106781);
    let dirStyle   = "cartesian"
    
    let patchSize  = 200;

    let overlap   = 0.2;
    // Fun stuff
    let growProb  = 1;
    let baseSplitProb  = 0.25 ;
    let showEdge  = true;
    let nSplits = 1;
    // Shrink Factors
    let baseShrink = 1;     // no shrink
    //?
    let separationAngle = 1
    // Init config objects to reduce num free-floating variables...
    var config = new crystalConfig(startPoint, dirStyle, overlap, patchSize, growProb, 
                                   baseSplitProb, nSplits, showEdge, separationAngle, 
                                   baseShrink)
    }
    return config;
  }
}