

export class CoordinateSystem{
    constructor(style="cartesian"){
        this.style = style;
        this.setAxes()
    }
    setAxes(style="cartesian"){
        if (style=="cartesian"){
            this.axisVec = new Vector(0, 0, 0, 1)
        }else if (style=="diag"){
            this.axisVec = new Vector(0, 0, Math.sqrt(2), Math.sqrt(2))
        }
    }
    getAxisVec(){
        return new Vector(this.axisVec)
    }
    getRandomAlongAxisDir(){
        /* Random orthonormal basis vector*/
        let theta = Math.round(Math.random() * 3) * 90
        return new Vector(this.axisVec).rotate(theta).normalize();
    }
}

export class Vector{
    constructor(row=0, col=0, _dirX=0, _dirY=1, v="none"){
        if (v.className == "Vector"){
            this.row = v.row;
            this.col = v.col;
            this._dirX = v._dirX;
            this._dirY = v._dirY;
        } else{
            this.row = row;
            this.col = col;
            this._dirX = _dirX;
            this._dirY = _dirY;
        }
        this.normalize()
    }
    getXY(){
        return [this.row, this.col]
    }
    getDir(){
        this.normalize()
        return [this._dirX, this._dirY]
    }
    normalize(){
        let mag = Math.sqrt(this._dirX**2+this._dirY**2);
        this._dirX = this._dirX/mag;
        this._dirY = this._dirY/mag;
        return this;
    }
    rotate(angle = "random"){
        /* angle in degrees!*/
        if (angle == "random"){
            var theta = Math.random()* 2 * Math.PI;
        } else{
            var theta = angle * Math.PI / 180.0;
        }
        this._dirX = this._dirX * Math.cos(theta) - this._dirY * Math.sin(theta);
        this._dirY = this._dirX * Math.cos(theta) + this._dirY * Math.sin(theta);
        return this;
    }
}

export class randomVectorGenerator{
    randomVectors(maxRow, maxCol, N){
    let arr = new Array()
    let c = new CoordinateSystem("diag");
    let randVec;
    for (let x=0; x<N; x++){
        randVec = c.getAxisVec().rotate("random");
        randVec.row =+ Math.round(Math.random()*maxRow)
        randVec.col =+ Math.round(Math.random()*maxCol)
        arr.push(randVec)
        }
    return arr
    }
    grid(maxRow, maxCol, N){
    let row, col;
    let arr = new Array()
    for (let m=0; m<N+1; m++){
        row = m * maxRow/(N-1);
        for (let n=0; n<N+1; n++){
            col = n * maxCol/(N-1);
            arr.push(new Vector(row, col, 0, 1))
        }
    }
    return arr
    }
}


