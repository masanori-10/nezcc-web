///<reference path='../../typings/node/node.d.ts'/>
///<reference path='../../typings/express/express.d.ts'/>
var express = require('express');
var router = express.Router();
var http = require('../helper/post');
var config = require('config');
var exec = require('child_process').exec;
var fs = require('fs');
var tmp = require('tmp');
var path = require('path');

function genResponse(res, j) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(j));
    res.end('\n');
}
function createFileAndExec(opeg_tempdir, opeg_tempfile, opeg, command, callback) {
  exec('cd ' + opeg_tempdir, function (nout) {
    fs.writeFileSync(opeg_tempfile, opeg);
    exec(command, function (out) {
      callback(out);
    });
  });
}

router.post('/generate', function(req, res) {
  tmp.dir(function(opeg_err,opeg_tempdir) {
    if(opeg_err) {
      console.log(opeg_err);
      return;
    }
    var opeg_tempfile = req.body.gname + ".opeg";
    var dest_file = req.body.gname + '.' + req.body.ext;
    var output_file = "output.txt";
    var exec_command = 'origami nezcc -g ' + opeg_tempfile + ' ' + req.body.tlang + '.nezcc > ' + output_file;
    console.log(exec_command);
    createFileAndExec(opeg_tempdir, opeg_tempfile, req.body.opeg, exec_command, function(stdout) {
      try {
        var output = fs.readFileSync(output_file,'utf8');
        var dest = fs.readFileSync(dest_file,'utf8');
        fs.unlinkSync(opeg_tempfile);
        fs.unlinkSync(output_file);
        fs.unlinkSync(dest_file);
        if(output.length > 0 && dest.length > 0) {
          var outputData = output.toString();
          var destData = dest.toString();
          if(outputData&&destData){
            var j = { output: outputData, dest: destData, runnable: true };
          } else {
            var j = { output: outputData.toString(), dest: destData.toString(), runnable: false };
          }
          genResponse(res, j);
        }
      } catch(err) {
        var msg = "";
        var error_j = { output: msg, dest: msg, runnable: false };
        genResponse(res, error_j);
      }
    });
  });
});
module.exports = router;
