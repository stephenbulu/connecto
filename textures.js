circleColors = {
    "red": "0xFF0000",
    "blue": "0x0000FF",
    "purple": "0xFF00FF",
    "green": "0x00FF00",
    "yellow": "0xFFFF00",
    'orange': "0xFF6000"
}
circleSizes = [15, 25, 40]

shadowAlphas = [0.06, 0.25, 0.35, 0.5]


shadowAlphas = [1, 1, 1, 1]

circleTextures = []
shadowTextures = []

//create textures for each color
Object.keys(circleColors).forEach(function(_color) {

    circleTextures[_color] = {}
    shadowTextures[_color] = {}
    
    //textures for each size 
    for(i=0;i<circleSizes.length;i++){

        _size = circleSizes[i];
        var graphics = new PIXI.Graphics();
        graphics.lineStyle(1, 0x000000, .5);
        graphics.beginFill(circleColors[_color], 1);
        graphics.drawCircle(0, 0,_size);
        graphics.endFill();
        circleTextures[_color][_size] = graphics.generateTexture()
        shadowTextures[_color][_size] = []

        // shadows with different alphas so we can change how prominent the shadow is
        for(j=0;j<4;j++){
            var graphics = new PIXI.Graphics();
            graphics.lineStyle(0);
            graphics.beginFill(circleColors[_color], shadowAlphas[j]);
            graphics.drawCircle(0, 0,_size+8+(j*2));
            graphics.endFill();
            shadowTextures[_color][_size].push(graphics.generateTexture())
        }
    };

});