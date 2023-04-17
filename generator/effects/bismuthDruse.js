import {CoordinateSystem, Vector} from "./geometry.js";
import {crystalConfig} from "./configs.js";
import {BismuthCrystal} from "./bismuthCrystal.js"
import { imageConfigDefault } from "next/dist/server/image-config.js";
import { addAuthorRoyalties } from "../royalties.js"
const AUTHOR_TEZOS_ADDRESS = "tz2RTukHBKaDs4dWgYQATddt4ZgMjy5DwLxv"


/*
This should happen in a "batch-apply function" that draws everything.
addAuthorRoyalties(AUTHOR_TEZOS_ADDRESS, royalties);
*/

export function bismuthWrapper(config_code, nFiller, HEIGHT, WIDTH, n_growth_steps){
    // (1) Setup crystal effects
    let [baseConfig, splitConfig, seedList] = new crystalConfig().getCommonConfig(config_code, HEIGHT, WIDTH)

    // (2) Set up secondary sources (filler imagery)
    let druse  = new BismuthDruse(seedList, "cartesian", baseConfig, splitConfig, nFiller)

    // (3) Execute simulation
    for (let frameIdx = 0; frameIdx < n_growth_steps; frameIdx++){
        druse.growCrystals()
    }

    return druse;
}

export class BismuthDruse{
    /* Manages a collection of Bismuth crystals
    TODO: if nothing's given to constructor, generate random;
    wrap whole procedure into a function hidden from generate.js?
    */
   constructor(seedList, coordStyle, baseConfig, splitConfig, nFiller){
    this.crystals    = new Array();
    this.baseConfig  = baseConfig;
    this.splitConfig = splitConfig;
    this.nFiller = nFiller;
    this.coordSys = new CoordinateSystem(coordStyle)
    this.frame = 0
    for (const seed of seedList){
        // Randomize start position?
        this.newCrystal(this.baseConfig.patchSize, "random", seed)
    }
}

len(){return this.crystals.length;}
newCrystal(patchSize, fillerID="random", seed = "none", fromSplit = false){
    /* Parse Config */
    if (fromSplit){
        var config = this.splitConfig;
    }else {
        var config = this.baseConfig;
    } 
    /* Check for seed override */
    if (seed == "none"){
        seed = config.startPoint;
    }else if (seed == "axis-random"){
        seed = this.coordSys.getRandomAlongAxisDir();
    }else if (seed == "random"){
        seed = this.coordSys.getAxisVec().rotate("random")
    }
    /* Set filler ID if one isn't given */
    if (fillerID=="random"){
        fillerID = this.randomFillerID();
    }
    /* Set a random position in the source image. 
        Set as a fraction of the source image's dimension*/
    let srcCoord = {'row':0.5,'col':0.5}

    /* Create the new Crystal */
    this.crystals.push(new BismuthCrystal(seed, fillerID, srcCoord, patchSize,
                                          this.frame, config.growProb, 
                                          config.splitDelay, config.splitProb, 
                                          config.overlap, config.dirStep)
    )
    return ;
}
growFilter(){
    let frame = this.frame
    return function checkTime(crystal){
        // return !crystal.dead & (frame >= crystal.firstFrame) & (frame <= crystal.lastFrame()+1)
        return !crystal.dead & (frame >= crystal.firstFrame)
   }
}
drawFilter(frame){
    return function checkTime(crystal){
        return (frame >= crystal.firstFrame) & (frame <= crystal.lastFrame())
   }
}

growCrystals(){
    this.frame++
    for (const crystal of this.crystals.filter(this.growFilter())){
        crystal.tryToGrow()

        if (crystal.tryToSplit(this.frame)){
            // Halt growth:
            crystal.kill()
            // Determine parent reference
            if (crystal.isChild){
                var parent_config = this.splitConfig
            }else{
                var parent_config = this.baseConfig
            }
            // Derive a number of children crystals from parent:
            let delAng = parent_config.sepAng / (parent_config.nSplits-1)
            let [row, col] = crystal.getXY()
            let [dirX, dirY] = crystal.getDir()
            let patchSize = parent_config.patchSizeFactor * crystal.patchSize;

            if (patchSize>1){
                let return_new, override;
                let fromSplit=true;
                for (let childIdx = 0; childIdx < parent_config.nSplits; childIdx++){
                    let seed = new Vector(row, col, 
                                          dirX, dirY).rotate(childIdx * delAng)// - 
                                        //   parent_config.sepAng/2)
                    seed = crystal.grow(return_new=true, override=seed)
                    
                    this.newCrystal(patchSize, "random", seed, fromSplit)

                }
                
            }
        }
    }
}

randomFillerID(){
    if (this.nFiller<=0){
        var key = "main_image";
    }else{
        key = "filler"+(Math.floor(Math.random() * (this.nFiller-1)));
    }
    return key;
}
}
