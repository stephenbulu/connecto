circleColors = {
    "red": "0xFF0000",
    "blue": "0x0000FF",
    "purple": "0xFF00FF",
    "green": "0x00FF00",
    "yellow": "0xFFFF00"
}
circleSizes = [15, 25, 50]

circleTextures = []
shadowTextures = []

Object.keys(circleColors).forEach(function(_color) {
    


    circleTextures[_color] = {}
    shadowTextures[_color] = {}

    for(i=0;i<circleSizes.length;i++){

        _size = circleSizes[i]

        var graphics = new PIXI.Graphics();
        graphics.lineStyle(1, 0xFFFFFF, 1);
        graphics.beginFill(circleColors[_color], 1);
        graphics.drawCircle(0, 0,_size);
        graphics.endFill();
        circleTextures[_color][_size] = graphics.generateTexture()

        var graphics = new PIXI.Graphics();
        graphics.lineStyle(0);
        graphics.beginFill(circleColors[_color], 0.25);
        graphics.drawCircle(0, 0,_size+10);
        graphics.endFill();
        shadowTextures[_color][_size] = graphics.generateTexture()
    }


});