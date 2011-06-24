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
    
    tooltip = (function(){
        var 
        node = document.createElement('div');   //TODO: need to describe css
        node.id = 'tooltip';
        node.style.display = 'none';
        document.body.appendChild(node);
        
        
        _render = function(conf) {
            var
            date = conf.date || '',
            status = conf.date || '',
            links = conf.date || '',
            text = conf.date || '';
            
            
        }
        _moveTo = function(elem) {}
        
        return {
            show: function(id, o){
                _render({
                    date:data[id].date,
                    status:data[id].status,
                    links:data[id].links,
                    text:data[id].text
                })
                _moveTo(o);
            }
        }
    })();
    tables = [],
    form = {},
    data = {}
    
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
    _generateIds = function(aTables) {
        aTables.each(function() {
            var id;
            do {id = Math.random().toString().substr(2,10)}
            while(!tables.ids[id])
            this.id = id;
        })
    }
    _addEvents = function(arr) {
        arr.each(function(){this.addEventListener('click', function(event){
            /wb-cell-status/.test(event.target.className)&&tooltip.show(this.id, event.target);
            /wb-button-save/.test(event.target.className)&&_save();
        }, false)})
    }
    
    return {
        init: function(){
            _getContent();
            tables = document.getElementsByClassName('wikibox');
            if(tables[0])return;    //nothing to do
            tables.raw = [];
            tables.each(function() {
                this.id ? (tables.ids[this.id] = this) : tables.raw.push(this)
            });
            tables.raw.length && _generateIds(tables.raw);
            delete tables.raw;
            data.each(function() {
                tables.ids[this] ? tables.ids[this].fill(data[this])
                    : data[this].raw()
            });
            
            _addEvents(tables);
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