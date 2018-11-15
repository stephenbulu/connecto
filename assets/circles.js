var RAINBOW_MODE = 1
var NORMAL_MODE = 0
function CircleHandler(world, pixiApp, board) {
    this.Circle = function(color, size) {
        this.size = size;
        this.color = color;
        this.pixiCircle = null
        this.pixiShadow = null
        this.edges = []
        this.groupSize = 1
        this.physicsBody = null
        this.destroying = false // a flag to let us know we need to destroy the circle next iteration
        this.destroyAfter = 0
        this.body = null
        this.hitBottom = false // a flag so we know that if destroyed it plays a different sound and has no points
        this.outOfBounds = false
        this.remake = false
    }
    
    
    this.matchRange = 20
    this.matchMode = RAINBOW_MODE
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
    this.sizesToUse = [15, 25, 40, 50, 60]
    this.colors = textures.colors
    //this.colorsToUse = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]//max 12+2
    this.first = true
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
// Had to remake -- box2d was taking seconds to remove the joints for some reason
CircleHandler.prototype.remakeCircle = function(circle) {
    var _ = circle.physicsBody.getPosition()
    oldVelocity = circle.physicsBody.getLinearVelocity();
    oldVelocity.x = 0;
    this.world.destroyBody(circle.physicsBody)

    body = world.createDynamicBody(_);
    body.setLinearVelocity(oldVelocity);
    body.setLinearDamping(1)
    body.setAngularDamping(1)
    fixture = body.createFixture({
        shape: planck.Circle((circle.size+1)/this.board.pixelToMeterRatio),
        density: .01,
        friction: 0,
        restitution: 0,
        filterGroupIndex: 0,
        filterCategoryBits: this.board.collisions.CIRCLES_CATEGORY,
        filterMaskBits: 0xFFFF ^ this.board.collisions.CIRCLES_CATEGORY //^ this.board.collisions.BOARD_CATEGORY
    });
    body.circle = circle
    circle.physicsBody = body

    this.disconnectCircle(circle)
}

CircleHandler.prototype.setGroupSize = function(circle){
    var bfs = function(fn, obj){
        var q = [circle]
        var visited = [circle]
        while(q.length>0){
            var node = q.pop()
            fn(node, obj)
            for(var i=0;i<node.edges.length;i++){
                var nNode = node.edges[i]
                if(! visited.includes(nNode)){
                    q.push(nNode)
                    visited.push(nNode)
                }
            }
        }       
    }
    var newGroupSize = 0
    bfs(function(){newGroupSize++})
    
    bfs(function(node, obj){
        node.groupSize = newGroupSize
        var updatedTexture = textures.getShadow(node.color,node.size,Math.min(newGroupSize-1, 3));
        if (node.pixiShadow.texture != updatedTexture){
            node.pixiShadow.texture = textures.getShadow(node.color,node.size,Math.min(newGroupSize-1, 3));
            node.pixiShadow.setParent(obj.shadowLayer[Math.min(newGroupSize-1, obj.layerAlphas.length-1)]);
        }
        if(newGroupSize >= obj.minGroupSize){
            node.destroying = true
            node.destroyAfter = Date.now() + 500
        }
    }, this)
}
CircleHandler.prototype.hitSideWall = function(circle){
    circle.outOfBounds = true;
    circle.remake = true;
    
}
CircleHandler.prototype.circleWentOut = function(circle){
    circle.hitBottom = true;
    circle.destroying = true;
    circle.destroyAfter = 0;

}
CircleHandler.prototype.dropNextCircle = function(){
    if(this.lastDroppedTime + 210 > Date.now()) return;
    if(this.nextCircle === null) return;
    var x = this.nextCircle.pixiCircle.x;
    var y = this.nextCircle.pixiCircle.y;
    body = world.createDynamicBody(this.board.pixelsToMeters(x, y));
    body.setLinearVelocity(planck.Vec2(0, -15));
    body.setLinearDamping(1)
    body.setAngularDamping(1)
    fixture = body.createFixture({
        shape: planck.Circle((size+1)/this.board.pixelToMeterRatio),
        density: .01,
        friction: 0,
        restitution: 0,
        filterGroupIndex: 0,
        filterCategoryBits: this.board.collisions.CIRCLES_CATEGORY,
        filterMaskBits: 0xFFFF// ^ this.board.collisions.CIRCLES_CATEGORY
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
    //color = this.colorsToUse[Math.floor(Math.random() * this.colorsToUse.length)]
    color = Math.floor(Math.random() * 360)
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
CircleHandler.prototype.disconnectCircle = function(circle) {
    for(var i=0;i<circle.edges.length;i++){
        node = circle.edges[i]
        index = node.edges.indexOf(circle)
        if(index < 0){
            console.log("This shouldn't happen.---")
        } else {
            node.edges.splice(index, 1)
            this.setGroupSize(node);
        }
    }
    circle.edges = [];
    this.setGroupSize(circle);

}
CircleHandler.prototype.destroyCircle = function(circle) {
    this.disconnectCircle(circle);
    circle.pixiCircle.parent.removeChild(circle.pixiCircle);
    circle.pixiShadow.parent.removeChild(circle.pixiShadow);
    this.world.destroyBody(circle.physicsBody);
}
CircleHandler.prototype.updateCircles = function(mousePos){
    while(this.jointsToMake.length > 0){
        jointdef = this.jointsToMake.pop()
        if (! jointdef.getBodyA().circle.outOfBounds && ! jointdef.getBodyB().circle.outOfBounds){
            joint = world.createJoint(jointdef)
        }
    }
    for (i=0;i<this.circles.length;i++) {
        circle = this.circles[i]
        if (circle.remake){
            circle.remake = false;
            this.remakeCircle(circle);
        }
    }
    i=0
    while(i < this.circles.length){
        circle = this.circles[i]
        if(circle.destroying && circle.destroyAfter <= Date.now()){
            circle.destroying = false
            this.destroyCircle(circle)
            if (circle.hitBottom){
                //console.log("play bad sounds")
            } else {
                sounds.play('pop');
            }
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
    if (circleA.outOfBounds || circleB.outOfBounds) return;

    if(this.matchMode == RAINBOW_MODE){
        a = circleA.color
        b = circleB.color
        c = Math.min(a, b) + 360
        d = Math.max(a, b)
        if ( ! (Math.abs(a - b) <= this.matchRange || Math.abs(c - d) <= this.matchRange)){
            return;
        }

    }else{
        if (circleA.color != circleB.color) return;
    }
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
    var newGroupSize = circleA.groupSize + circleB.groupSize
    //minimum group size decides if we will remove this group from the board
    bodyAPos = bodyA.getPosition()
    bodyBPos = bodyB.getPosition()
    //When grouping the circles stop
    bodyA.setLinearVelocity(planck.Vec2(0, 0))
    bodyB.setLinearVelocity(planck.Vec2(0, 0))
    jointdef = planck.DistanceJoint(100, bodyA, bodyB, bodyAPos, bodyBPos)
    jointdef.setLength((circleA.size + circleB.size +1 )/this.board.pixelToMeterRatio);
    this.jointsToMake.push(jointdef)
    
    this.setGroupSize(circleA);

}
