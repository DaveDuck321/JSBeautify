var fs = require("fs");
var UglifyJS = require("uglify-js");
var PNG = require("pngjs").PNG;
var JSFrick = require("./jsfuck/jsfuck.js").JSFuck;

var upper = arg(4, 0.6);
var lower = arg(5, -1);
var kernel = [
    [0.1, 0.1, 0.1],
    [0.1, 0.5, 0.1],
    [0.1, 0.1, 0.1]
];

function arg(index, defaultValue) {
    return process.argv[index]?process.argv[index]:defaultValue;
}

function density(densityArray, imageX, imageY, kernel) {
    var result = 0;
    for(var y = 0; y < kernel.length; y++) {
        var testY = imageY + y-Math.floor(kernel.length/2);
        if(testY < 0 || testY >= densityArray.length) continue;
        for(var x = 0; x < kernel[0].length; x++) {
            var testX = imageX + x-Math.floor(kernel[0].length/2);
            if(testX < 0 || testX >= densityArray[0].length) continue;

            result += densityArray[testY][testX] * kernel[y][x];
        }
    }
    return result;
}

function getDensityArray(index) {
    var densityArray = [];
    var data = fs.readFileSync(arg(3, "masks/rem.png").replace("#", index));
    var png = PNG.sync.read(data);
    for (var y = 0; y < png.height; y++) {
        densityArray.push([]);
        for (var x = 0; x < png.width; x++) {
            var idx = (png.width * y + x)<<2;
            densityArray[y].push(1 - png.data[idx]/255);
        }
    }
    return densityArray;
}

function getImageString(frickedString) {
    var outString = "";
    var stringIndex = 0;
    var arrayIndex = 0;
    while(true) {
        var densityArray = getDensityArray(arrayIndex++);
        for(var y = 0; y < densityArray.length; y+=2) {
            for(var x = 0; x < densityArray[0].length; x++) {
                var d = density(densityArray, x, y, kernel);
                if(d < upper && d > lower) {
                    outString += frickedString[stringIndex++];

                    if(stringIndex == frickedString.length)   return outString;
                } else outString += " ";
            }
            outString += "\n";
        }
        outString += "\n\n";
    }
}

function beautifyFile(file, outfile) {
    var normieCode = fs.readFileSync(file, "utf8");
    var uglyCode = UglifyJS.minify(normieCode).code;
    if(!uglyCode) {
        console.log("Could not Uglify, prepare for MASSIVE output");
        uglyCode = normieCode;
    }
    var frickedString = JSFrick.encode(uglyCode, false, false);

    fs.writeFileSync(outfile, "eval(\n" + getImageString(frickedString) + ")");
    console.log("Your code is now BEAUTIFUL. Enjoy: " + outfile);
}

beautifyFile(process.argv[2], arg(6, "out.js"));