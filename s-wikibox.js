Object.prototype.each = function(fn) {
    for(var p in this) this.hasOwnProperty(p) && fn.call(this[p])
};
Array.prototype.each = function(fn) {
    var i=0,l;
    for(l=this.length;i<l;i++)fn.call(this[i])
};


var WikiBox = (function(){
    var     //classes section
    cTable = function(id){
        this.header = new cRow();
        this.body = {};
    }
    cTable.prototype = {
        fill: function(data){}        
    }
    
    
            //end classes
    
    
    $q = document.querySelector,
    tables = [],
    form = {},
    _data = {}
    
    _getContent = function(){
        var url = location.href.replace('view','edit')
            + '?t=' + Math.random().toString().substr(2,10)
            + ';nowysiwyg=1';
        var req = new XMLHttpRequest();
        req.open('get', url, true);
        req.onreadystatechange = function(){
            this.readyState^4
                ||_prepare(this.responseText);
        };
        req.send(null);
    }
    _prepare = function(text){
        text = text
        .replace(/<script>[\w\W]*?<\/script>/gim, '')   //delete all scripts
        .replace(/<head>[\w\W]*?<\/head>/gim, '')       //delete head element
        .replace(/src\="/gim, 'orig="');                //replace src attribute
        
        var
        script = /\n.*\n<script.*?id.*?wb-script[\w\W]*$/,
        divs = /&lt;div.*?class\="wb-table".*?&gt;/gm,
        newline = '\n',
        scriptText = ''
            + newline + '<!-- <pre> -->'
            + newline + '<script id="wb-script" type="text/Javascript">'
            + newline + '//<!--'
            + newline + 'WikiBox.set('+JSON.stringify(tables)+');'
            + newline + '//-->'
            + newline + '</script>'
            + newline + '<!-- <pre> -->';
        
        var div = document.createElement('div');
        div.setAttribute('id', 'wb-edit-content');
        div.innerHTML = text;
        
        form.nowysiwyg = 1;
        form.settingstopic = '%SETTINGSTOPIC%';
        form.originalrev = document.querySelector('[name="originalrev"]').value;
        form.sig = div.querySelector('#sig').innerHTML;
        form.text = div.querySelector('#topic').innerHTML
        .replace(document.querySelector('#wb-script') ? script : /$/, scriptText)
        .replace(divs, function(){return '&lt;div class="wb-table" id="'+tables[i++].id+'"&gt;'})
        
    }
    _submit = function(text,callback){
        var req = new XMLHttpRequest();
        req.open('post', location.href.replace('view','save'), true);
        req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
        req.onreadystatechange = function(){this.readyState^4||callback()}
        req.send(text)
    }
    _render = function(){}
    
    return {
        init: function(){
            _getContent();
            var exist, saved, i, id;
            exist = View.getContainers(Model.getName('cl_cont'));
            exist.raw && View.setNewId(Model.getNewId(exist.raw));
			
            saved = Model.getSaved();
            for (i=exist.list.length;i--;) {
                id = exist.list[i];
                if(!saved.ids[id]) {
                    saved.raw.push(id);
                    continue
               }
            exist.ids[id] = Model.getCellData(id);
            }
            saved.raw && Model.setNewId(saved.raw);
            View.render(exist.ids);
            addEvents(window);
        },
        save: function(){
            var content = '';
            form.each(function(){content+='&'+this+'='+escape(form[this])})
            content = content.replace(/^&/,'');
            _submit(content, fn)
        },
        set: function(o){}
    }
})();