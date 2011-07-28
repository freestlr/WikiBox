var WikiBox = (function(){
    var
    tables = [],
    form = {},
    data = {},
    selector = {
        table_header_class: '',
        table_date_class: '',
        table_result_class: '',
        
        iframe_container_id: 'wb-edit-content',
        
        tooltip_id: 'wb-tooltip',
        tooltip_header_id: 'wb-tt-header',
        tooltip_status_id: 'wb-tt-status',
        tooltip_details_id: 'wb-tt-details',
        tooltip_bugzilla_id: 'wb-tt-bzlist'
    };
    
    var
    Tooltip = (function(){
        var
        node = $('<div>').attr('id',selector.tooltip_id).hide().appendTo(document.body).bind('click', handle)[0];
        node.header = $('<div>').attr('id',selector.tooltip_header_id).appendTo(node)[0];
        node.status = $('<div>').attr('id',selector.tooltip_status_id).appendTo(node)[0];
        node.details = $('<div>').attr('id',selector.tooltip_details_id).appendTo(node)[0];
        node.bzlist = $('<div>').attr('id',selector.tooltip_bugzilla_id).appendTo(node)[0];
        
        content = {},
        
        _render = function(conf) {
            var
            date = conf.date || '',
            status = conf.date || '',
            links = conf.date || '',
            text = conf.date || '';
            
            
        },
        _moveTo = function(elem) {
            var 
            offset = $(elem).offset(),
            width = $(elem).css('width'),
            height = $(elem).css('height');
            $(node).css({
                top: offset.top + height,
                left: offset.left + (width/2)
            })
        },
        _bzLink = function(link) {
            return '<a href="http://tools.datasub.com/bugzilla/show_bug.cgi?id='+link+'">'+link+'</a>'
        },
        _view = function(elem) {
            var links = '';
            $(content.links).each(function() {
                links += _bzLink(this) + '<pre>, </pre>'
            })
            $(node.header).html('<a href="#">Edit Result</a>')
            $(node.status).html(_showStatus(content.status))
            $(node.details).html(content.details)
            $(node.bzlist).html(links);
        },
        _edit = function(elem) {
            $(node.header).html('<a href="#">View Result</a>')
            $(node.status).html(_editStatus(content.status))
            $(node.details).html('<textarea>'+content.details+'</textarea>')
            $(node.bzlist).html('input type="text" value="'+content.links.join(', ')+'">');
        };
        
        return {
            show: function(id, el){
                var col = el.className.replace(/^.*?cell\-([\d]+).*/,'$1');
                content = data[id][col];
                content ? _view() : _edit();
                _render(content)
                _moveTo(el);
                $(node).show();
            }
        }
    })(),
    
    _fill = function(table, data) {
        table.querySelectorAll()
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
            + newline + '&lt;!-- &lt;pre&gt; --&gt;'
            + newline + '&lt;script id="wb-script" type="text/Javascript"&gt;'
            + newline + '//&lt;!--'
            + newline + 'WikiBox.set('+JSON.stringify(data)+');'
            + newline + '//--&gt;'
            + newline + '&lt;/script&gt;'
            + newline + '&lt;!-- &lt;pre&gt; --&gt;';
        
        var iframe = $('<div>').attr('id', iframe_container_id).html(text)
                
        form.nowysiwyg = 1;
        form.settingstopic = '%SETTINGSTOPIC%';
        form.originalrev = iframe.querySelector('[name="originalrev"]').value;
        form.sig = iframe.querySelector('#sig').value;
        form.text = iframe.querySelector('#topic').innerHTML
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
            type: 'post',
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
                type: 'get',
                success: _prepare
            });
            tables = document.querySelector('.wikibox');
            if(!tables[0])return;           //no tables - nothing to do
            tables.ids = {};
            $(tables).each(function() {     //store existing ids and generate new
                if(!this.id) {
                    var id;                 //each id is ten-digit number
                    do {id = Math.random().toString().substr(2,10)}
                    while(tables.ids[id])
                    this.id = id;
                }
                tables.ids[this.id] = this;
                $(this).bind('click', handleTableClick)
            });
            $(data).each(function() {       //fill tables with stored data
                tables.ids[this]
                    ? fill(tables.ids[this], data[this])
                    : data[this].raw()
            });
        },
        
        set: function(o){           //make some verifications here if needed
            $(o).each(function(){
                if (o.hasOwnProperty(this)) data[this] = o[this]
            })
        }
    }
})();

window.onload = function() {
    WikiBox.init();
}