circleColors = {
    "red": ["0xFF0000", "0xFF6060"],
    "blue": ["0x2222FF", "0x8080FF"],
    "purple": ["0xFF00FF", "0xFF00FF"],
    "green": ["0x00FF00", "0x60FF60"],
    "yellow": ["0xDDDD00", "0xFFFF00"],
    'orange': ["0xFF6000", "0xFF6060"]
}

circleColors = {
    "red": ["0x741D11", "0xC3311D"],
    "blue": ["0x264779", "0x3E74C6"],
    "purple": ["0x4D2A86", "0x713DC3"],
    "green": ["0x17814D", "0x1FB46C"],
    "yellow": ["0x816C04", "0xC3A406"],
    'orange': ["0x83400B", "0xc66011"]
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
        graphics.lineStyle(0, 0xFFFFFF, .5);
        graphics.beginFill(circleColors[_color][1], 1);
        graphics.drawCircle(0, 0,_size);
        graphics.endFill();
        circleTextures[_color][_size] = graphics.generateTexture()
        shadowTextures[_color][_size] = []

        // shadows with different alphas so we can change how prominent the shadow is
        for(j=0;j<4;j++){
            var graphics = new PIXI.Graphics();
            graphics.lineStyle(0);
            graphics.beginFill(circleColors[_color][0], shadowAlphas[j]);
            graphics.drawCircle(0, 0,_size+5+(j*2));
            graphics.endFill();
            shadowTextures[_color][_size].push(graphics.generateTexture())
        }
    };

});