     
function Board(){
    this.spaceDown = false // is space bar pressed
    this.width = 1500
    this.height = 1200
    this.wallThickness = 25
    this.leftMargin = 250
    this.rightMargin = 250
    this.pixelToMeterRatio = 50.0
    this.topMargin = 600
    this.score = 0;
    this.scoreText = null;
    this.drawBoard = function(pixiApp, uiLayer){
        amnt = this.score.toString()
        //while (amnt.length < 8) {amnt = "0" + amnt;}
        var text = new PIXI.Text(amnt, {
            fontFamily: 'Arial',
            fontSize: 40,
            fill: '#DDDDDD',
            align: 'center',    
            stroke: '#000000',
            strokeThickness: 3,
        });
        text.anchor.set(1.0, 0.0)
        text.x = 180
        text.y = 20
        uiLayer.addChild(text)
        this.scoreText = text;
    }
    this.updateScore = function(score){
        this.score += score
        this.scoreText.setText(this.score.toString())
    }
    this.pixelsToMeters = function(x, y){
        return planck.Vec2((x - this.leftMargin) / this.pixelToMeterRatio, (this.height-y) / this.pixelToMeterRatio)
    }
    this.metersToPixels = function(x, y){
        return {x:Math.round(x * this.pixelToMeterRatio + (this.leftMargin)), y:this.height-y*this.pixelToMeterRatio}
    }

    this.createEdges = function(world){
        this.collisions = {
            'BOARD_CATEGORY': 0x0004,
            'OUTERBOARDER_CATEGORY': 0x0002,
            'CIRCLES_CATEGORY': 0x0008
        }

        var a = this.leftMargin
        var b = this.rightMargin
        var c = this.wallThickness
        var d = this.topMargin
        var boardEdges = [
            [this.pixelsToMeters(a, this.height-c),this.pixelsToMeters(this.width-b, this.height-c)],
            [this.pixelsToMeters(a, this.height-c),this.pixelsToMeters(a, d)],
            [this.pixelsToMeters(a, d),this.pixelsToMeters(a-c, d)],
            [this.pixelsToMeters(a-c, this.height),this.pixelsToMeters(a-c, d)],
            [this.pixelsToMeters(this.width-b, this.height-c),this.pixelsToMeters(this.width-b, d)],
            [this.pixelsToMeters(this.width-b, d),this.pixelsToMeters(this.width-b+c, d)],
            [this.pixelsToMeters(this.width-b+c, d),this.pixelsToMeters(this.width-b+c, this.height)]
        ]
        var boardPhysics = world.createBody({type: 'static'});
        for(i=0;i<boardEdges.length;i++){
            x = boardEdges[i][0]
            y = boardEdges[i][1]
            boardPhysics.createFixture({
                shape: planck.Edge(x, y),
                filterGroupIndex: 0,
                filterCategoryBits: this.collisions.BOARD_CATEGORY,
                filterMaskBits: 0xFFFF
            })
        }
        // Far right and far left container
        this.boardSides = world.createBody({type: 'static'});
        var x = this.pixelsToMeters(0, 0)
        var y = this.pixelsToMeters(0, this.height)
        this.boardSides.createFixture({shape: planck.Edge(x, y)})
        var x = this.pixelsToMeters(this.width-this.rightMargin+this.leftMargin, 0)
        var y = this.pixelsToMeters(this.width-this.rightMargin+this.leftMargin, this.height)
        this.boardSides.createFixture({
            shape: planck.Edge(x, y),
            filterGroupIndex: 0,
            filterCategoryBits: this.collisions.OUTERBOARDER_CATEGORY,
            filterMaskBits: 0xFFFF
        })
        
        // Edge on the bottom 
        this.boardBottom = world.createBody({type: 'static'});
        var x = this.pixelsToMeters(0, this.height)
        var y = this.pixelsToMeters(this.width, this.height)
        this.boardBottom.createFixture({
            shape: planck.Edge(x, y),
            filterGroupIndex: 0,
            filterCategoryBits: this.collisions.OUTERBOARDER_CATEGORY,
            filterMaskBits: 0xFFFF
        })
        
    }
}



// Initialize board object
var board = new Board();

//Initialize Pixi renderer
var pixiApp = new PIXI.Application(board.width, board.height, { antialias: true });
document.body.appendChild(pixiApp.view);
console.log(pixiApp.renderer.plugins.interaction)




//Initialize planck world
var world = planck.World({
    gravity: planck.Vec2(0, -10)
    //velocityIterations: 20,
    //positionIterations: 20
});
//Initialize sounds and textures
var sounds = new Sound()
var textures = new Textures()


//Initialize scorehandler 
var scoreHandler = new ScoreHandler(world, pixiApp, board);

//Initialize circlehandler 
var circleHandler = new CircleHandler(world, pixiApp, board, scoreHandler);

// Add ui container
var uiLayer = new PIXI.Container();
pixiApp.stage.addChild(uiLayer);

var pointsLayer = new PIXI.Container();
pixiApp.stage.addChild(pointsLayer);
scoreHandler.pointsLayer = pointsLayer

board.drawBoard(pixiApp, uiLayer)

// Draw the board 
var graphics = new PIXI.Graphics();

// set a fill and line style
graphics.beginFill(0x555555);
graphics.lineStyle(0);

// Draw board shape
graphics.moveTo(board.leftMargin, board.topMargin);
graphics.lineTo(board.leftMargin, board.height-board.wallThickness);
graphics.lineTo(board.width-board.rightMargin, board.height-board.wallThickness);
graphics.lineTo(board.width-board.rightMargin, board.topMargin);
graphics.lineTo(board.width-board.rightMargin+board.wallThickness, board.topMargin);
graphics.lineTo(board.width-board.rightMargin+board.wallThickness, board.height);
graphics.lineTo(board.leftMargin-board.wallThickness, board.height);
graphics.lineTo(board.leftMargin-board.wallThickness, board.topMargin);
graphics.lineTo(board.leftMargin, board.topMargin);
graphics.endFill();

// Add to UI layer
uiLayer.addChild(graphics);

//Create the physics restrictions for the board
board.createEdges(world);

//Callbacks from planck, physics library
world.on('begin-contact', function(fixturePair) {
    body_a = fixturePair.getFixtureA().getBody()
    body_b = fixturePair.getFixtureB().getBody()
    if(body_a.m_type == "static" || body_b.m_type == "static"){
        return
    }
    circleHandler.collide(body_a, body_b)
});

world.on('pre-solve', function(contact) {
    body_a = contact.m_fixtureA.m_body
    body_b = contact.m_fixtureB.m_body
    if (body_a == board.boardBottom){
        circleHandler.circleWentOut(body_b.circle);
    } else if (body_b == board.boardBottom){
        circleHandler.circleWentOut(body_a.circle);
    } else if (body_b.circle !== undefined && body_a == board.boardSides &&  ! body_b.circle.outOfBounds){
            circleHandler.hitSideWall(body_b.circle);
    } else if (body_a.circle !== undefined && body_b == board.boardSides &&  ! body_a.circle.outOfBounds){
            circleHandler.hitSideWall(body_a.circle);
    }
});


var mousePos = planck.Vec2(board.width/2, 0);
var mouseInBounds = false
var mDown = false
var lastAutoDrop = 0
window.onmousedown = function(event){
    if (event.button == 0){
        mDown = true
        circleHandler.dropNextCircle();
        lastAutoDrop = Date.now()
    }
};
window.onmouseup = function(event){
    if (event.button == 0){
        mDown = false
        lastAutoDrop = 0
    }
};
window.onkeyup = function(event){
    if (event.which === 32) {
        board.spaceDown = false
    }
};
window.onkeydown = function(event){
    if (event.which === 32) {
        board.spaceDown = true
    }
};



pixiApp.renderer.plugins.interaction.cursorStyles.default = "inherit";
pixiApp.renderer.backgroundColor = 0xCCCCCC;
// Set stage to interactive so we can get mouse events
pixiApp.stage.interactive = true
pixiApp.stage.on('mousemove', function(event){
    mousePos = event.data.getLocalPosition(pixiApp.stage)
    if (mousePos.x >= board.leftMargin && mousePos.x <= board.width-board.rightMargin){
        if (!mouseInBounds){
            pixiApp.renderer.plugins.interaction.cursorStyles.default = "url(https://s3.amazonaws.com/myamazoncdnbucket/cursor2.png) 16 0, auto";
            pixiApp.view.style.cursor = "url(https://s3.amazonaws.com/myamazoncdnbucket/cursor2.png) 16 0, auto";
            mouseInBounds = true
        }
    } else {
        if (mouseInBounds){
            pixiApp.renderer.plugins.interaction.cursorStyles.default = "inherit";
            pixiApp.view.style.cursor = "inherit";
            mouseInBounds = false
        }
    }
});
count = 0
function mainLoop(){
    if (mouseInBounds && mDown && lastAutoDrop + 350 < Date.now()){
        circleHandler.dropNextCircle();
        lastAutoDrop = Date.now()
    }
    world.step(1 / (60 * (Math.max(pixiApp.ticker.FPS, 30) / 60)))
    count++
    circleHandler.updateCircles(mousePos)
    scoreHandler.updatePoints();
};
pixiApp.ticker.add(mainLoop);