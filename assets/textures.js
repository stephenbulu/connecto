// Sounds
function Sound(){
    this.lastTime = {'pop':0,'bounce':0,'waterdrop':0,'frog':0}
    this.sounds = {}
    this.sounds['pop'] = new PIXI.sound.Sound.from('https://s3.amazonaws.com/myamazoncdnbucket/pop.wav');
    this.sounds['bounce'] = new PIXI.sound.Sound.from('https://s3.amazonaws.com/myamazoncdnbucket/bounce.mp3');
    this.sounds['pop'].volume = .4
    this.sounds['bounce'].volume = .2
    this.sounds['waterdrop'] = new PIXI.sound.Sound.from('https://s3.amazonaws.com/myamazoncdnbucket/waterdrop.mp3');
    this.sounds['frog'] = new PIXI.sound.Sound.from('https://s3.amazonaws.com/myamazoncdnbucket/frog.mp3');
    this.sounds['frog'].volume = .15
    this.sounds['waterdrop'].volume = .8
    this.play = function(sound){
        if(Date.now - this.lastTime[sound] < 100){
            return;
        }
        this.sounds[sound].play()
        this.lastTime[sound] = Date.now()
    }
}
function getColorList(){
    var rgbToHex = function (rgb) { 
        var hex = Number(rgb).toString(16);
        if (hex.length < 2) {
                hex = "0" + hex;
        }
        return hex;
    };
    var fullColorHex = function(arr) {   
        var red = rgbToHex(arr[0]);
        var green = rgbToHex(arr[1]);
        var blue = rgbToHex(arr[2]);
        return '0x'+red+green+blue;
    };
    function hslToRgb(h, s, l){
        var r, g, b;

        if(s == 0){
            r = g = b = l; // achromatic
        }else{
            var hue2rgb = function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    var circleColors = []

    for(i=0;i<360;i++){
        var lightness1 = .30//.50
        var lightness2 = .20//.26
        var saturation = 1//.70
        if (false && i%2 != 0){
            var saturation = .5
            var lightness1 = .60
            var lightness2 = .36
        }
        var hue = (360/360 * i) / 360
        circleColors.push([fullColorHex(hslToRgb(hue, saturation, lightness1)), fullColorHex(hslToRgb(hue, saturation, lightness2))])
    }
    circleColors.push( [fullColorHex(hslToRgb(0, 0, .27)), fullColorHex(hslToRgb(0, 0, .20))] )
    circleColors.push( [fullColorHex(hslToRgb(0, 0, .08)), fullColorHex(hslToRgb(0, 0, .08))] )
    return circleColors

}

function Textures(){
    var circleColors = getColorList();
    this.colors = circleColors.length
    var circleSizes = [15, 25, 40, 50, 60]
    this.circleTextures = []
    this.shadowTextures = []

    var graphics = new PIXI.Graphics();
    graphics.lineStyle(0);
    graphics.beginFill('0xFF0000', 1);
    graphics.drawCircle(0, 0, 10);
    graphics.drawCircle(0, 10, 15);
    graphics.drawCircle(0, 15, 20);
    graphics.endFill();
    this.cursor = graphics.generateTexture() 

    //create textures for each color
    this.addCircleTexture = function(index, color, size, height){
        var graphics = new PIXI.Graphics();
        graphics.lineStyle(0);
        graphics.beginFill(color, 1);
        _size = size
        if(height >= 0){
            _size += 5+2*height
        }
        graphics.drawCircle(0, 0, _size);
        graphics.endFill();
        if(height >= 0){
            if (this.shadowTextures[index] === undefined) this.shadowTextures[index] = {};
            if (this.shadowTextures[index][size] === undefined) this.shadowTextures[index][size] = {};
            this.shadowTextures[index][size][height] = graphics.generateTexture()
        }else{
            if (this.circleTextures[index] === undefined) this.circleTextures[index] = {};
            this.circleTextures[index][size] = graphics.generateTexture()
        }
    }
    
    for (var x=0;x< circleColors.length; x++) {
        circleColor = circleColors[x]
        for(var i=0;i<circleSizes.length;i++){
            size = circleSizes[i];
            this.addCircleTexture(x, circleColor[0], size, -1)
            for(var j=0;j<4;j++){
                this.addCircleTexture(x, circleColor[1], size, j)
            };
        };       
    }
    this.getCircle = function(color, size){
        try{
            if(this.circleTextures[color][size] === undefined){
                throw 'Tried to load texture that has not been created color:'+color+' size:'+size;
            }
        }catch(e){
            console.log(e)
            throw 'Tried to load texture that has not been created color:'+color+' size:'+size;
        }
        
        return this.circleTextures[color][size]
    }
    this.getShadow = function(color, size, height){
        try{
            if(this.shadowTextures[color][size][height] === undefined){
                throw 'Tried to load texture that has not been created color:'+color+' size:'+size+' height:'+height;
            }
        }catch(e){
            console.log(e)
            throw 'Tried to load texture that has not been created color:'+color+' size:'+size+' height:'+height;
        }
        
        return this.shadowTextures[color][size][height]
    }
}