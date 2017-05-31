///<reference path="../../typings/jquery/jquery.d.ts" />
///<reference path="../../typings/jquery/jquery_plugins.d.ts" />
///<reference path="../../typings/ace/ace.d.ts" />
///<reference path="../../typings/vmjs/vmjs.d.ts" />
///<reference path='../../typings/config/config.d.ts'/>
var createNodeViewFromP4DJson;
var VisModelJS;
var PolymerGestures;
var opegEditor;
var navbarId = ["navbar-overview", "navbar-documents", "navbar-playground"];
var contentId = ["overview", "documents", "playground"];
var editorId = ["opeg"];
var inputFocus = "both";
var setEditorId = [];
var reader = new FileReader();
var destData;
var destFileName;
$(function () {
    // 初期化
    opegEditor = ace.edit("opegEditor");
    opegEditor.setTheme("ace/theme/xcode");
    opegEditor.getSession().setMode("ace/mode/c_cpp");
    opegEditor.setFontSize(12);

    var TopNode = createNodeViewFromP4DJson({ "": "" });

    $(window).resize(function () {
        var width = $(window).width();
        var sidebarW = $('.sidebar-right').width();
        $('.sidebar-right').css("left", width - sidebarW + "px");
        resizeTextarea();
    });
    $("#output > .dropdown > ul > li > a").click(function () {
        $("#output > .dropdown > button").text($(this).text());
        $("#output > .dropdown > button").append("<span class=caret>");
        document.querySelector('#output > .dropdown > button').value = $(this).attr("value");
    });
    $(".btn-refresh").click(function () {
      refresh();
    });
    $("#generate").click(generateParser);
    setSource();
    opegEditor.on("change", changeEditor);
});
$(window).on('touchmove.noScroll', function (e) {
    e.preventDefault();
});
$(window).load(function () {
    resizeTextarea();
    refresh();
});
var timer;
function changeEditor(e) {
    clearTimeout(timer);
}

function refresh() {
  setOpeg("math", "Math");
  // outputEditor.setValue("");
  $("#output > .dropdown > button").text("java8");
  $("#output > .dropdown > button").append("<span class=caret>");
  document.querySelector('#output > .dropdown > button').value = "java";
}

function generateParser(e){
  var opeg = opegEditor.getValue();
  var gname = document.getElementById('fileName').value
  var tlang = document.getElementById('dropdownOutput').innerText;
  var ext = document.getElementById('dropdownOutput').value;
  runGenerate(opeg, gname, tlang, ext, function(res){
      document.getElementById('outputtxt').innerText = res.output;
      destData = res.dest;
      destFileName = gname + '.' + ext;
      document.getElementById('download').innerText = destFileName;
    }, () => {
      console.log("sorry");
  });
}

function runGenerate(opeg, gname, tlang, ext, callback, onerror){
  $.ajax({
    type: "POST",
    url: Config.basePath + "/generate",
    data: JSON.stringify({opeg: opeg, gname: gname, tlang: tlang, ext: ext}),
    dataType: 'json',
    contentType: "application/json; charset=utf-8",
    success: callback,
    error: onerror
  })
}

function AsciiToUint8Array(S) {
  var len = S.length;
  var P = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    P[i] = S[i].charCodeAt(0);
  }
  return P;
}

function SaveToFile(FileName,Stream) {
  if (window.navigator.msSaveBlob) {
    window.navigator.msSaveBlob(new Blob([Stream.subarray(0, Stream.length)], { type: "text/plain" }), FileName);
  } else {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([Stream.subarray(0, Stream.length)], { type: "text/plain" }));
    //a.target   = '_blank';
    a.download = FileName;
    document.body.appendChild(a) //  FireFox specification
    a.click();
    document.body.removeChild(a) //  FireFox specification
  }
}

function run(){
  var Stream = new Uint8Array(AsciiToUint8Array(destData));
  SaveToFile(destFileName,Stream);
}

function resizeTextarea(toSize) {
    if (toSize) {
      console.log('resizing true');
        for (var i = 0; i < editorId.length; i++) {
            var target = ".collapse-block[id='" + editorId[i] + "']";
            if (i != 2) {
                var divHeight = $(".container").outerHeight(true) * toSize * 0.7;
            }
            else {
                var divHeight = $(".container").outerHeight(true) * toSize;
            }
            var headHeight = $(target + " > .ground-label").outerHeight(true);
            $(target + " > pre").css("height", divHeight - headHeight - 2 + "px");
            $(target + " > textarea").css("height", divHeight - headHeight - 1 + "px");
        }
    }
    else {
      console.log('resizing false');
        for (var i = 0; i < editorId.length; i++) {
            var target = ".collapse-block[id='" + editorId[i] + "']";
            var divHeight = $(target).height();
            var headHeight = $(target + " > .ground-label").outerHeight(true);
            $(target + " > pre").css("height", divHeight - headHeight - 2 + "px");
            $(target + " > textarea").css("height", divHeight - headHeight - 1 + "px");
        }
    }
}
function setOpeg(fileName, displayName) {
    $.ajax({
        type: "GET",
        url: "./opeg/" + fileName + ".opeg",
        success: function (res) {
            if (opegEditor != null) {
                opegEditor.setValue(res);
                opegEditor.clearSelection();
                opegEditor.gotoLine(0);
                // $("span[id='opeg'] > .dropdown > button").text(displayName);
                // $("span[id='opeg'] > .dropdown > button").append("<span class=caret>");
            }
        }
    });
}
function setSource() {
  console.log('setting source');
    var target = $('.fileUploader');
    target.each(function () {
        var txt = $(this).find('.txt');
        console.log(txt);
        if (txt.length == 0) {
            var txt = $("span[id='opeg'] > .dropdown > .txt");
        }
        var btn = $(this).find('.btn');
        var uploader = $(this).find('.uploader');
        uploader.bind('change', function (e) {
            var targetInput = e.target;
            var files = targetInput.files;
            console.log(files);
            txt.val($(this).val());
            txt.text(files[0].name);
            setEditorId.push($(this).attr("id"));
            reader.readAsText(files[0]);
        });
        btn.bind('click', function (event) {
            event.preventDefault();
            return false;
        });
    });
    reader.addEventListener("load", function () {
        console.log(setEditorId);
        switch (setEditorId.shift()) {
            case "opeg":
                opegEditor.setValue(reader.result);
                opegEditor.clearSelection();
                opegEditor.gotoLine(0);
                break;
        }
    });
}
