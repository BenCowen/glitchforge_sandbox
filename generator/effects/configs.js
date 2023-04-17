import {CoordinateSystem, randomVectorGenerator, Vector} from "./geometry.js";

export class crystalConfig{
    /* Manages a collection of Bismuth crystals*/
   constructor(startPoint = "none", overlap = 0.05, 
               patchSize = 0.175, growProb = 1, splitProb = 0.25, splitDelay=0, nSplits = 2,
               highlightEdges = false, separationAngle = 180, patchSizeFactor = 1, dirStep = 0,
               config_code="none"){

        if (config_code != "none"){
            this.getCommonConfig(config_code)
        } else{
            this.startPoint = startPoint
            this.overlap    = overlap
            this.patchSize  = patchSize
            this.growProb   = growProb
            this.splitProb  = splitProb
            this.nSplits    = nSplits
            this.doEdges    = highlightEdges
            this.sepAng     = separationAngle
            this.patchSizeFactor = patchSizeFactor
            this.splitDelay=splitDelay
            this.dirStep = dirStep
        }
   }
   getCommonConfig(config_code, HEIGHT, WIDTH){
    let rv = new randomVectorGenerator();
    if (config_code==0){
        // Initial Crystal:
        let c = new CoordinateSystem("diag");
        let startPoint = c.getRandomAlongAxisDir();
        startPoint.row = 200
        startPoint.col = 200
        
        let patchSize  = 200;
    
        let overlap   = 0.2;
        // Fun stuff
        let growProb  = 1;
        let splitProb  = 1;
        let showEdge  = true;
        let nSplits = 3;
        let splitDelay = 10;
        // Shrink Factors
        let patchShrink = 0.5;
        let dirStep = 0
        //?
        let separationAngle = 180
        // Base Config:
        var config = new crystalConfig(startPoint, overlap, patchSize, growProb, 
                                       splitProb, splitDelay, nSplits, showEdge, separationAngle, 
                                       patchShrink, dirStep)
        // Child Config
        var splitConfig = new crystalConfig(startPoint, overlap, patchSize, growProb, 
                            splitProb, splitDelay, nSplits, showEdge, separationAngle, 
                            patchShrink, dirStep)
        splitConfig.splitProb = 0.25;
        splitConfig.patchSizeFactor = 0.5;
        splitConfig.splitDelay = 0;
    
        var seedList = new Array(new Vector(0, 0, 1, 1));
        } else if (config_code==1){
    
    // Initial Crystal:
    let c = new CoordinateSystem("diag");
    let startPoint = c.getRandomAlongAxisDir();
    startPoint.row = 200
    startPoint.col = 200
    
    let patchSize  = 200;

    let overlap   = 0.2;
    // Fun stuff
    let growProb  = 0.05;
    let splitProb  = 1;
    let showEdge  = true;
    let splitDelay = 10;
    // Shrink Factors
    let patchShrink = 0.5;
    let dirStep = 45
    //?
    let separationAngle = 360
    let nSplits = 6;

    // Base Config:
    var config = new crystalConfig(startPoint, overlap, patchSize, growProb, 
                                   splitProb, splitDelay, nSplits, showEdge, separationAngle, 
                                   patchShrink, dirStep)
    // Child Config
    var splitConfig = new crystalConfig(startPoint, overlap, patchSize, growProb, 
                        splitProb, splitDelay, nSplits, showEdge, separationAngle, 
                        patchShrink, dirStep)
    // splitConfig.splitProb = 0.2;
    splitConfig.growProb = 0.9;
    splitConfig.splitProb = 0.2;
    splitConfig.patchSizeFactor = 0.9;
    splitConfig.splitDelay = 20;

    var seedList = rv.grid(HEIGHT, WIDTH, 10)
    }
    return [config, splitConfig, seedList];
  }
}