     
function Board(){
    this.width = 1600
    this.height = 900
    this.wallThickness = 25
    this.leftMargin = 100
    this.rightMargin = 600
    this.pixelToMeterRatio = 50.0
    this.pixelsToMeters = function(x, y){
        return planck.Vec2((x - this.leftMargin) / this.pixelToMeterRatio, (this.height-y) / this.pixelToMeterRatio)
    }
    this.metersToPixels = function(x, y){
        return {x:Math.round(x * this.pixelToMeterRatio + (this.leftMargin)), y:this.height-y*this.pixelToMeterRatio}
    }
    var a = this.leftMargin
    var b = this.rightMargin
    var c = this.wallThickness
    this.edges = [
        [this.pixelsToMeters(a, this.height-c),this.pixelsToMeters(this.width-b, this.height-c)],
        [this.pixelsToMeters(a, this.height-c),this.pixelsToMeters(a, 100)],
        [this.pixelsToMeters(a, 100),this.pixelsToMeters(a-c, 100)],
        [this.pixelsToMeters(a-c, this.height),this.pixelsToMeters(a-c, 100)],
        [this.pixelsToMeters(this.width-b, this.height-c),this.pixelsToMeters(this.width-b, 100)],
        [this.pixelsToMeters(this.width-b, 100),this.pixelsToMeters(this.width-b+c, 100)],
        [this.pixelsToMeters(this.width-b+c, 100),this.pixelsToMeters(this.width-b+c, this.height)]
    ]
}
board = new Board();


//Initialize Pixi renderer
var pixiApp = new PIXI.Application(board.width, board.height, { antialias: true });
document.body.appendChild(pixiApp.view);

//Initialize planck world
var world = planck.World({
    gravity: planck.Vec2(0, -10)
    //velocityIterations: 20,
    //positionIterations: 20
});
//Initialize sounds and textures
var sounds = new Sound()
var textures = new Textures()

//Initialize circlehandler 
var circleHandler = new CircleHandler(world, pixiApp, board);

// Add ui container
this.uiLayer = new PIXI.Container();
pixiApp.stage.addChild(uiLayer);

// Draw the board 
var graphics = new PIXI.Graphics();

// // set a fill and line style
graphics.beginFill(0x555555);
graphics.lineStyle(0);
// draw a shape
graphics.moveTo(board.leftMargin, 100);
graphics.lineTo(board.leftMargin, board.height-board.wallThickness);
graphics.lineTo(board.width-board.rightMargin, board.height-board.wallThickness);
graphics.lineTo(board.width-board.rightMargin, 100);
graphics.lineTo(board.width-board.rightMargin+board.wallThickness, 100);
graphics.lineTo(board.width-board.rightMargin+board.wallThickness, board.height);
graphics.lineTo(board.leftMargin-board.wallThickness, board.height);
graphics.lineTo(board.leftMargin-board.wallThickness, 100);
graphics.lineTo(board.leftMargin, 100);
graphics.endFill();

// Add to UI layer
uiLayer.addChild(graphics);

//Create the physics restrictions for the board

var boardGraphics = world.createBody({type: 'static'});
boardEdges = board.edges
for(i=0;i<boardEdges.length;i++){
    a = boardEdges[i][0]
    b = boardEdges[i][1]
    boardGraphics.createFixture({shape: planck.Edge(a, b)})
}

//Callbacks from planck, physics library
world.on('begin-contact', function(fixturePair) {
    body_a = fixturePair.getFixtureA().getBody()
    body_b = fixturePair.getFixtureB().getBody()
    if(body_a.m_type == "static" || body_b.m_type == "static"){
        return
    }
    circleHandler.collide(body_a, body_b)
});


var mousePos = {x:board.width/2, y:0};


function addRandCircle(){
    circleHandler.dropNextCircle();
}

pixiApp.stage.interactive = true

window.onmousedown = function(event){
    circleHandler.dropNextCircle();
};

pixiApp.stage.on('mousemove', function(event){
    mousePos = event.data.getLocalPosition(pixiApp.stage)
});
count = 0
function mainLoop(){
    world.step(1 / (60 * (Math.max(pixiApp.ticker.FPS, 30) / 60)))
    count++
    circleHandler.updateCircles(mousePos)
};
pixiApp.ticker.add(mainLoop);