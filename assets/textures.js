// Sounds
function Sound(){
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
        this.sounds[sound].play()
    }
}


// old colors
// circleColors = {
//     "red": ["0x741D11", "0xC3311D"],
//     "blue": ["0x264779", "0x3E74C6"],
//     "purple": ["0x4D2A86", "0x713DC3"],
//     "green": ["0x17814D", "0x1FB46C"],
//     "yellow": ["0x816C04", "0xC3A406"],
//     'orange': ["0x83400B", "0xc66011"],
//     'gray': ["0x474747", "0x999999"]
// }

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

    var list = [
    ['red', 7, 75], 
    ['yellow', 55, 75], 
    ['green', 135, 75], 
    ['orange', 26, 80], 
    ['blue', 210, 85], 
    ['teal', 170, 70], 
    ['purple', 263, 50], 
    ['indigo', 250, 70], 
    ['magenta', 330, 75]
    ]

    var hueOffset = 0
    var lightness1 = .50
    var lightness2 = .26
    var circleColors = {}
    for (i=0;i<list.length;i++) {
        name = list[i][0]
        hue = list[i][1]
        saturation = list[i][2]/100.0
        first = fullColorHex(hslToRgb(hue/360, saturation, lightness1))
        second = fullColorHex(hslToRgb(hue/360, saturation, lightness2))
        circleColors[name] = [first, second]
    }

    circleColors['gray'] = [fullColorHex(hslToRgb(0, 0, .27)), fullColorHex(hslToRgb(0, 0, .20))]
    circleColors['black'] = [fullColorHex(hslToRgb(0, 0, .08)), fullColorHex(hslToRgb(0, 0, .08))]
    return circleColors
}

function Textures(){
    this.colorsList = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'indigo', 'purple', 'magenta', 'gray', 'black']
    
    var circleColors = getColorList();
    var circleSizes = [15, 25, 40, 50, 60]

    this.circleTextures = {}
    this.shadowTextures = {}

    //create textures for each color
    this.addTexture = function(name, color, size, height){
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
            if (this.shadowTextures[name] === undefined) this.shadowTextures[name] = {};
            if (this.shadowTextures[name][size] === undefined) this.shadowTextures[name][size] = {};
            this.shadowTextures[name][size][height] = graphics.generateTexture()
        }else{
            if (this.circleTextures[name] === undefined) this.circleTextures[name] = {};
            this.circleTextures[name][size] = graphics.generateTexture()
        }
    }
    
    for (var colorName in circleColors) {
        if (!circleColors.hasOwnProperty(colorName)) continue;
        for(i=0;i<circleSizes.length;i++){
            size = circleSizes[i];
            this.addTexture(colorName, circleColors[colorName][0], size, -1)
            for(j=0;j<4;j++){
                this.addTexture(colorName, circleColors[colorName][1], size, j)
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