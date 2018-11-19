function ScoreHandler(world, pixiApp, board) {
    this.world = world
    this.pixiApp = pixiApp
    this.board = board
    this.Points = function(position, amount){
        this.position = position
        this.amount = amount
        this.pixi = null
        this.creationTime = 0
    }
    this.points = []; // list of points sprites

    this.pointsLayer = null;

}
ScoreHandler.prototype.generatePoints = function(circle, circleHandler) {
    _ = circle.physicsBody.getPosition()
    pos = this.board.metersToPixels(_.x, _.y)

    var amount = 100;
    
    if (circle.groupSize > circleHandler.minGroupSize){
        diff = circle.groupSize - circleHandler.minGroupSize
        amount = amount*1.5**diff
    }
    index =  circleHandler.sizesToUse.indexOf(circle.size)
    amount = Math.floor(amount*circleHandler.sizesToPoints[index])

    point = new this.Points({x: pos.x, y: pos.y}, amount)
    var text = new PIXI.Text(amount.toString(), {
        fontFamily: 'Arial',
        fontSize: 35,
        fill: 'white',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 3,
    });
    text.x = pos.x-circle.size/2
    text.y = pos.y-12
    this.pointsLayer.addChild(text)
    point.pixi = text
    point.creationTime = Date.now()
    this.points.push(point)
}

ScoreHandler.prototype.updatePoints = function() {
    for(var i=this.points.length-1;i>=0;i--){
        point = this.points[i]
        if (point.creationTime + 500 <= Date.now()){
            this.board.updateScore(point.amount)
            point.pixi.parent.removeChild(point.pixi)
            this.points.splice(i, 1);
        }
    }
}