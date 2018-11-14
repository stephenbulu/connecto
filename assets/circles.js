function CircleHandler(world, pixiApp, board) {
    this.Circle = function(color, size) {
        this.size = size;
        this.color = color;
        this.pixiCircle = null
        this.pixiShadow = null
        this.edges = []
        this.groupSize = 1
        this.physicsBody = null
        this.destroying = false
        this.body = null
    }
    this.lastDroppedTime = 0
    this.nextCircle = null
    this.world = world
    this.pixiApp = pixiApp
    this.board = board;
    this.circles = [];
    this.vertices = [];
    // Initialize all containers to control z index of shadows and circles
    this.layerAlphas = [.05, 0.3, 0.45, 0.65, 1]
    this.layerAlphas = [.05, 0.3, 0.4, 0.5, .6, .7, 1]
    this.minGroupSize = 5
    this.shadowLayer = []
    this.jointsToMake = []
    this.sizes = [15, 25, 40, 50, 60]
    this.sizesToUse = [15, 25, 40, 50, 60, 40]
    this.colors = textures.colors
    this.colorsToUse = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]//max 12+2
    for(i=0;i<this.layerAlphas.length;i++){
        var alphaFilter = new PIXI.filters.AlphaFilter();
        alphaFilter.alpha = this.layerAlphas[i];
        this.shadowLayer[i] = new PIXI.Container();
        this.shadowLayer[i].filters = [alphaFilter];
        pixiApp.stage.addChild(this.shadowLayer[i]);
    }
    this.circlesLayer = new PIXI.Container();
    pixiApp.stage.addChild(this.circlesLayer);
}
CircleHandler.prototype.dropNextCircle = function(){
    if(this.lastDroppedTime + 210 > Date.now()) return;
    if(this.nextCircle === null) return;
    x = this.nextCircle.pixiCircle.x
    y = this.nextCircle.pixiCircle.y
    body = world.createDynamicBody(this.board.pixelsToMeters(x, y));
    body.setLinearVelocity(planck.Vec2(0, -20));
    body.setLinearDamping(1)
    body.setAngularDamping(1)
    body.createFixture({
        shape: planck.Circle((size+1)/this.board.pixelToMeterRatio),
        density: .01,
        friction: 0,
        restitution: 0
    });
    this.nextCircle.physicsBody = body
    body.circle = this.nextCircle
    this.circles.push(this.nextCircle)
    this.nextCircle = null
    this.lastDroppedTime = Date.now()
    sounds.play('frog');
}
CircleHandler.prototype.getNextCircle = function(){
    size = this.sizesToUse[Math.floor(Math.random() * this.sizesToUse.length)]        
    color = this.colorsToUse[Math.floor(Math.random() * this.colorsToUse.length)]
    //create circle sprite
    var circle = new PIXI.Sprite(textures.getCircle(color,size));
    circle.anchor.set(0.5);
    circle.x = 0;
    circle.y = 50;
    this.circlesLayer.addChild(circle);
    //create shadow sprite
    var shadow = new PIXI.Sprite(textures.getShadow(color,size, 0));
    shadow.anchor.set(0.5);
    shadow.x = 0;
    shadow.y = 50;
    this.shadowLayer[0].addChild(shadow);
    this.nextCircle = new this.Circle(color, size);
    this.nextCircle.pixiCircle = circle
    this.nextCircle.pixiShadow = shadow
}
CircleHandler.prototype.setMinGroupSize = function(size){
    lastGroupSize = this.minGroupSize
    this.minGroupSize = size
}
CircleHandler.prototype.destroyCircle = function(circle) {
    circle.pixiCircle.parent.removeChild(circle.pixiCircle)
    circle.pixiShadow.parent.removeChild(circle.pixiShadow)
    this.world.destroyBody(circle.physicsBody)
    sounds.play('pop');

}
CircleHandler.prototype.updateCircles = function(mousePos){
    while(this.jointsToMake.length > 0){
        jointdef = this.jointsToMake.pop()
        joint = world.createJoint(jointdef)
    }
    i=0
    while(i < this.circles.length){
        circle = this.circles[i]

        if(circle.destroying && circle.destroyAfter <= Date.now()){
            this.destroyCircle(circle)
            this.circles.splice(i, 1);
            i--
        }
        i++
    }
    for (i=0;i<this.circles.length;i++) {
        circle = this.circles[i];
        pxCircle = circle.pixiCircle
        pxShadow = circle.pixiShadow
        _ = circle.physicsBody.getPosition()
        newPosition = board.metersToPixels(_.x, _.y)
        velocity = circle.physicsBody.getLinearVelocity()
        if(false && Math.abs((pxCircle.x - newPosition.x) < 1 && velocity.x < .2) && (Math.abs(pxCircle.y - newPosition.y) < 1 && velocity.y < .2)){
            //Might put something here
        }else{
            pxCircle.x = newPosition.x, pxCircle.y = newPosition.y;
            pxShadow.x = newPosition.x, pxShadow.y = newPosition.y;
        }
        
    }
    if(this.lastDroppedTime+200 < Date.now()){
        if(this.nextCircle === null) this.getNextCircle();
        x = mousePos.x
        if(x < this.board.leftMargin + size + 2){
            x = this.board.leftMargin+size+2
        }
        if(x > this.board.width-this.board.rightMargin-size-2){
            x = this.board.width-this.board.rightMargin-size-2
        }
        this.nextCircle.pixiCircle.x = x
        this.nextCircle.pixiShadow.x = x
    }

}
CircleHandler.prototype.collide = function(bodyA, bodyB){
    circleA = bodyA.circle
    circleB = bodyB.circle

    
    if (circleA.color != circleB.color) return;
    if (circleA.edges.includes(circleB)) return;

    // Get the smallest group
    if(circleA.groupSize <= circleB.groupSize){
        start = circleA, other = circleB
    }else{
        start = circleB, other = circleA
    }
    if(start.groupSize > 1){
        q = [start]
        visited = [start]     
        while(q.length>0){
            node = q.pop()
            //Return if both the bodies are already in the same group
            if (node == other) return;
            for(i=0;i<node.edges.length;i++){
                nNode = node.edges[i]
                if(! visited.includes(nNode)){
                    q.push(nNode)
                    visited.push(nNode)
                }
            }
        }
    }
    sounds.play('waterdrop');
    circleA.edges.push(circleB)
    circleB.edges.push(circleA)                
    newGroupSize = circleA.groupSize + circleB.groupSize
    //minimum group size decides if we will remove this group from the board
    bodyAPos = bodyA.getPosition()
    bodyBPos = bodyB.getPosition()
    //When grouping the circles stop
    bodyA.setLinearVelocity(planck.Vec2(0, 0))
    bodyB.setLinearVelocity(planck.Vec2(0, 0))
    jointdef = planck.DistanceJoint(100, bodyA, bodyB, bodyAPos, bodyBPos)
    jointdef.setLength((circleA.size + circleB.size +1 )/this.board.pixelToMeterRatio);
    this.jointsToMake.push(jointdef)
    // init queue for BFS
    q = [circleA]
    visited = [circleA]
    // Loop through all connected circles and set a new group size
    while(q.length>0){
        node = q.pop()
        node.groupSize = newGroupSize
        node.pixiShadow.texture = textures.getShadow(node.color,node.size,Math.min(newGroupSize-1, 3));
        node.pixiShadow.setParent(this.shadowLayer[Math.min(newGroupSize-1, this.layerAlphas.length-1)])
        if(newGroupSize >= this.minGroupSize){
            node.destroying = true
            node.destroyAfter = Date.now() + 500
        }
        for(i=0;i<node.edges.length;i++){
            nNode = node.edges[i]
            if(!visited.includes(nNode)){
                q.push(nNode)
                visited.push(nNode)
            };
        };
    };
}
