var RAINBOW = 1
var NORMAL = 0
function CircleHandler(world, pixiApp, board, scoreHandler) {
    this.Circle = function(color, size) {
        this.size = size;
        this.color = color;
        this.pixiCircle = null
        this.pixiShadow = null
        this.pixiHighlight = null
        this.edges = []
        this.groupSize = 1
        this.physicsBody = null
        this.destroying = false // a flag to let us know we need to destroy the circle next iteration
        this.destroyAfter = 0
        this.body = null
        this.hitBottom = false // a flag so we know that if destroyed it plays a different sound and has no points
        this.outOfBounds = false
        this.remakePhysics = false
        this.highlight = false // render a highlight on the circle
        this.destroyed = false
    }
    this.matchRange = 20 // for rainbow mode
    this.matchMode = NORMAL
    this.lastDroppedTime = 0 // Time the last circle was dropped
    this.nextCircle = null // circle obj for the next circle to be dropped
    this.world = world
    this.pixiApp = pixiApp
    this.board = board;
    this.circles = []; // list of circle objects
    // Initialize all containers to control z index of shadows and circles
    this.layerAlphas = [.05, 0.3, 0.45, 0.65, .7, 1]
    //this.layerAlphas = [.05, 0.3, 0.4, 0.5, .6, .7, 1]// this should match minGroupSize
    this.shadowLayer = [] // a list of pixi containers with different alphas 
    this.jointsToMake = [] // a list of joints to create next iteration
    this.bodiesToDestroy = [] // bodies to delay destroying
    //this.sizes = [15, 25, 40, 50, 60]
    this.sizesToUse = [15, 25, 40, 50, 60]
    this.sizesToPoints = [.8, .9, 1, 1.1, 1.2]
    //this.colors = textures.colors
    this.colorsToUse = [7, 37, 90,  150, 180, 210, 250, 270, 300, 330];
    this.minGroupSize = 6 // minimum circle group size before they pop
    // generate all the containers for each alpha layer
    for(i=0;i<this.layerAlphas.length;i++){
        var alphaFilter = new PIXI.filters.AlphaFilter();
        alphaFilter.alpha = this.layerAlphas[i];
        this.shadowLayer[i] = new PIXI.Container();
        this.shadowLayer[i].filters = [alphaFilter];
        pixiApp.stage.addChild(this.shadowLayer[i]);
    }
    // add the container for the circle layer    
    this.circlesLayer = new PIXI.Container();
    pixiApp.stage.addChild(this.circlesLayer);
    // add the container for the circle highlight    
    this.highlightsLayer = new PIXI.Container();
    pixiApp.stage.addChild(this.highlightsLayer);

}
// Remake the physics body
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
        filterMaskBits: 0xFFFF ^ this.board.collisions.CIRCLES_CATEGORY
    });
    body.circle = circle
    circle.physicsBody = body

    this.disconnectCircle(circle)
}

CircleHandler.prototype.setGroupSize = function(circle){
    var bfs = function(fn){
        var q = [circle]
        var visited = [circle]
        while(q.length>0){
            var node = q.pop()
            fn(node)
            for(var i=0;i<node.edges.length;i++){
                var nNode = node.edges[i]
                if(! visited.includes(nNode)){
                    q.push(nNode)
                    visited.push(nNode)
                }
            }
        }       
    }
    // Count how many circles are in the group
    var newGroupSize = 0
    bfs(function(){newGroupSize++})
    // Update all the circles in the group
    bfs(function(node){
        node.groupSize = newGroupSize
        var updatedTextureParent = this.shadowLayer[Math.min(newGroupSize-1, this.layerAlphas.length-1)];
        if (node.pixiShadow.parent != updatedTextureParent){
            node.pixiShadow.texture = textures.getShadow(node.color,node.size,Math.min(newGroupSize-1, 3))
            node.pixiShadow.setParent(updatedTextureParent);
        }
        if(newGroupSize >= this.minGroupSize){
            node.destroying = true
            node.destroyAfter = Date.now() + 500
        }
    }.bind(this))
}
CircleHandler.prototype.hitSideWall = function(circle){
    this.disconnectCircle(circle);
    circle.outOfBounds = true;
    circle.remakePhysics = true;
}
CircleHandler.prototype.circleWentOut = function(circle){
    this.disconnectCircle(circle);
    circle.hitBottom = true;
    circle.destroying = true;
    circle.destroyAfter = 0;

}
CircleHandler.prototype.dropNextCircle = function(){
    if(this.lastDroppedTime + 210 > Date.now()) return;
    if(this.nextCircle === null) return;
    this.removeHighlights();
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
CircleHandler.prototype.highlightColor = function(color){
    for(var i=0;i<this.circles.length;i++){
        circle = this.circles[i]
        if (circle.color == color){
            circle.highlight = true
            highlight = new PIXI.Sprite(textures.getHighlight(circle.size));
            highlight.anchor.set(0.5);
            _ = circle.physicsBody.getPosition()
            position = this.board.metersToPixels(_.x, _.y)
            highlight.x = position.x
            highlight.y = position.y
            if (! this.board.spaceDown){
                highlight.renderable = false;
            }
            this.highlightsLayer.addChild(highlight)
            circle.pixiHighlight = highlight
        }
    }
}
CircleHandler.prototype.removeHighlights = function(){
    for(var i=0;i<this.circles.length;i++){
        circle = this.circles[i]
        if(circle.highlight === true){
            this.highlightsLayer.removeChild(circle.pixiHighlight)
            circle.highlight = false
            circle.pixiHighlight = null
        }
    }
}
CircleHandler.prototype.getNextCircle = function(){
    size = this.sizesToUse[Math.floor(Math.random() * this.sizesToUse.length)]        
    if (this.matchMode == NORMAL){
        color = this.colorsToUse[Math.floor(Math.random() * this.colorsToUse.length)]
    } else {
        color = Math.floor(Math.random() * 360)
    }
    
    //create circle sprite
    var circle = new PIXI.Sprite(textures.getCircle(color,size));
    circle.anchor.set(0.5);
    circle.x = 0;
    circle.y = 50;
    this.circlesLayer.addChildAt(circle, 0);
    //create shadow sprite
    var shadow = new PIXI.Sprite(textures.getShadow(color,size, 0));
    shadow.anchor.set(0.5);
    shadow.x = 0;
    shadow.y = 50;
    this.shadowLayer[0].addChild(shadow);
    this.nextCircle = new this.Circle(color, size);
    this.nextCircle.pixiCircle = circle
    this.nextCircle.pixiShadow = shadow
    this.highlightColor(color)
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
    if (! circle.outOfBounds && ! circle.hitBottom){
        scoreHandler.generatePoints(circle, this);
        this.bodiesToDestroy.push([Date.now(), circle.physicsBody])

    } else {
        this.world.destroyBody(circle.physicsBody);
    }
    circle.destroyed = true;
    circle.pixiCircle.parent.removeChild(circle.pixiCircle);
    circle.pixiCircle = null
    circle.pixiShadow.parent.removeChild(circle.pixiShadow);
    circle.pixiShadow = null
    if(circle.highlight){
        circle.pixiHighlight.parent.removeChild(circle.pixiHighlight)
        circle.highlight = false
    }
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
        if (circle.remakePhysics){
            circle.remakePhysics = false;
            this.remakeCircle(circle);
        }
    }
    i=0
    while(i < this.bodiesToDestroy.length){
        _ = this.bodiesToDestroy[i]
        time = _[0]
        body = _[1]
        if (time + 300 <= Date.now()) {
            this.world.destroyBody(body)
            this.bodiesToDestroy.splice(i, 1);
        } else {
            i++
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
        } else {
            i++
        }
    }
    for (i=0;i<this.circles.length;i++) {
        circle = this.circles[i];
        pxCircle = circle.pixiCircle
        pxShadow = circle.pixiShadow
        _ = circle.physicsBody.getPosition()
        newPosition = this.board.metersToPixels(_.x, _.y)
        velocity = circle.physicsBody.getLinearVelocity()
        if(false && Math.abs((pxCircle.x - newPosition.x) < 1 && velocity.x < .2) && (Math.abs(pxCircle.y - newPosition.y) < 1 && velocity.y < .2)){
            //Might put something here
        }else{
            pxCircle.x = newPosition.x, pxCircle.y = newPosition.y;
            pxShadow.x = newPosition.x, pxShadow.y = newPosition.y;
            if(circle.highlight === true){
                if (this.board.spaceDown){
                    circle.pixiHighlight.renderable = true
                } else {
                    circle.pixiHighlight.renderable = false
                }
                
                circle.pixiHighlight.x = newPosition.x
                circle.pixiHighlight.y = newPosition.y
            }
        }
        
    }
    if(true || this.lastDroppedTime+50 < Date.now()){
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
    if (circleA.destroyed || circleB.destroyed) return;

    if(this.matchMode == RAINBOW){
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
    //minimum group size decides if we will remove this group from the board
    bodyAPos = bodyA.getPosition()
    bodyBPos = bodyB.getPosition()
    //When grouping the circles stop
    bodyA.setLinearVelocity(planck.Vec2(0, 0))
    bodyB.setLinearVelocity(planck.Vec2(0, 0))
    jointdef = planck.DistanceJoint(100, bodyA, bodyB, bodyAPos, bodyBPos)
    jointdef.setLength((circleA.size + circleB.size +1 )/this.board.pixelToMeterRatio);
    this.jointsToMake.push(jointdef)
    
    this.setGroupSize(circleB);

}
