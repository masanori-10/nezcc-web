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
function createFileAndExec(opeg_tempfile, opeg, command, callback) {
    fs.writeFileSync(opeg_tempfile, opeg);
    exec(command, function (out) {
        callback(out);
    });
}

router.post('/generate', function(req, res) {
  tmp.file({prefix: 'opeg'}, function(opeg_err,opeg_tempfile,fd) {
    if(opeg_err) {
      console.log(opeg_err);
      return;
    }
    var dest_file = opeg_tempfile.replace(/.*\/|\..*/g,'') + '.' + req.body.ext;
    var exec_command = 'origami nezcc -g ' + opeg_tempfile + ' -Xblue.origami.nezcc.' + req.body.tlang + 'ParserGenerator';
    createFileAndExec(opeg_tempfile, req.body.opeg, exec_command, function(stdout) {
      var data = fs.readFileSync(dest_file);
      fs.unlinkSync(dest_file);
      console.log(data.toString());
      if(data.length > 0) {
        var sendData = data.toString();
        if(sendData){
          var j = { source: sendData, runnable: true };
        } else {
          var j = { source: data.toString(), runnable: false };
        }
        genResponse(res, j);
      } else {
        var msg = "";
        var error_j = { source: msg, runnable: false };
        genResponse(res, error_j);
      }
    });
  });
});
module.exports = router;
