var WikiBox = (function(){
    var
    tables = [],
    form = {},
    data = {},
    
    Tooltip = (function(){
        var node = $('<div>')       //TODO: need to describe css
        .attr('id','wb-tooltip')
        .css('display','none')
        .appendTo(document.body)
        .bind('click', handle)[0];

        node.header = $('<div>')
        .attr('id','wb-tt-header')
        .appendTo(node)[0];
        node.status = $('<div>')
        .attr('id','wb-tt-status')
        .appendTo(node)[0];
        node.details = $('<div>')
        .attr('id','wb-tt-details')
        .appendTo(node)[0];
        node.bzlist = $('<div>')
        .attr('id','wb-tt-bzlist')
        .appendTo(node)[0];
        
        content = [],
        
        _render = function(conf) {
            var
            date = conf.date || '',
            status = conf.date || '',
            links = conf.date || '',
            text = conf.date || '';
            
            
        },
        _moveTo = function(elem) {},
        _view = function(elem) {},
        _edit = function(elem) {};
        
        return {
            show: function(id, el){
                var col = el.className.replace(/^.*?cell\-([\d]+).*/,'$1');
                content = data[id][col];
                content ? _view() : _edit();
                _render({
                    date:data[id].date,
                    status:data[id].status,
                    links:data[id].links,
                    text:data[id].text
                })
                _moveTo(el);
                node.style.display = 'block';
            }
        }
    })(),
    
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
            + newline + '&lt;!-- &lt;pre&gt; --&gt;'
            + newline + '&lt;script id="wb-script" type="text/Javascript"&gt;'
            + newline + '//&lt;!--'
            + newline + 'WikiBox.set('+JSON.stringify(data)+');'
            + newline + '//--&gt;'
            + newline + '&lt;/script&gt;'
            + newline + '&lt;!-- &lt;pre&gt; --&gt;';
        
        var div = document.createElement('div');
        div.setAttribute('id', 'wb-edit-content');
        div.innerHTML = text;
        
        form.nowysiwyg = 1;
        form.settingstopic = '%SETTINGSTOPIC%';
        form.originalrev = div.querySelector('[name="originalrev"]').value;
        form.sig = div.querySelector('#sig').innerHTML;
        form.text = div.querySelector('#topic').innerHTML
        .replace(document.querySelector('#wb-script') ? script : /$/, scriptText)
        .replace(divs, function(){return '&lt;div class="wb-table" id="'+tables[i++].id+'"&gt;'})
        
    },
    _render = function(){}
    _save = function(){
        var content = '', i=0;
        $(form).each(function(){content+='&'+this+'='+escape(form[this])})
        content = content.replace(/^&/,'');
        $.ajax({
            url: location.href.replace('view','save'),
            method: 'post',
            data: content,
            success: function(){}
        })
    },
    
    handleTableClick = function(event) {
        var cls = event.target.className;
        /wb-cell-status/.test(cls) && Tooltip.show(this.id, event.target);
        /wb-button-save/.test(cls) && _save();
    }
    
    return {
        init: function(){
            $.ajax({
                url: location.href.replace('view','edit')
                    + '?t=' + Math.random().toString().substr(2,10)
                    + ';nowysiwyg=1',
                method: 'get',
                success: _prepare
            });
            tables = document.querySelector('.wikibox');
            if(!tables[0])return;           //no tables - nothing to do
            tables.ids = {};
            $(tables).each(function() {     //store existing ids and generate new
                if(!this.id) {
                    var id;                 //each id is ten-digit number
                    do { id = Math.random().toString().substr(2,10) }
                    while(tables.ids[id])
                    this.id = id;
                }
                tables.ids[this.id] = this;
                $(this).bind('click', handleTableClick)
            });
            $(data).each(function() {       //fill tables with stored data
                tables.ids[this]
                    ? tables.ids[this].fill(data[this])
                    : data[this].raw()
            });
        },
        
        set: function(o){           //make some verifications here if needed
            $(o).each(function(){
                data[this] = o[this]
            })
        }
    }
})();

window.onload = function() {
    WikiBox.init();
}