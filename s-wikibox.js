/* 
    Document   : wikibox.js
    Created on : 29.07.2011, 17:27:21
    Author     : alexey.kanischev
*/
var WikiBox = (function(){
    String.prototype.wrap = function(str) {
        return str + this + (/<\w+[^>]*>/.test(str) ? str.replace(/<(\w+).*/,'</$1>') : str)
    };
    var
    tables = {},
    form = [],
    /*
     *  data = {
     *      0123456789: [
     *          {header: 'FireFox', date: '01/03/2011', result: 'pass', links: [7901, 8351], details: ''},
     *          {header: 'Chrome', date: '12/09/2010', result: 'pass', links: [2838], details: ''},
     *          {header: 'Safari', date: '21/11/2011', result: 'fail', links: [1566], details: 'POS dont work'},
     *          {header: 'Internet Explorer 7', date: '15/10/2011', result: 'warn', links: [3261], details: 'Somethings wrong'},
     *          {header: 'Internet Explorer 8', date: '10/04/2011', result: 'pass', links: [], details: 'ie crashes'}
     *      ],
     *      3467894786: []
     *  }
     */
    storage = {
        data: {},
        defaults: {
            browsers: [
                'Apple Safari',
                'Google Chrome',
                'Mozilla FireFox',
                'Internet Explorer 6',
                'Internet Explorer 7',
                'Internet Explorer 8'
            ]
        },
        fill: function(table) {
            $(table, '.' + selector.table_header_class).each(function(){})
            $(table, '.' + selector.table_result_class).each(function(){})
        },
        raw: function(id) {
            var data = this.data[id] = [];
            var cols = storage.defaults.browsers;
            $(cols).each(function() {
                data.push({
                    header: this+'',
                    date: '',
                    result: '',
                    links: [],
                    details: ''
                })
            })
        }
    },
    selector = {
        table_class: 'wikibox',
        table_id: 'wb-tbl-',
        table_cell_index_class: 'wb-cell-',
        table_header_class: 'wb-tbl-header',
        table_date_class: 'wb-tbl-date',
        table_result_class: 'wb-tbl-result',
        
        script_data_id: 'wb-script',
        button_save_class: 'wb-btn-save',
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
        node = $('<div>').attr('id',selector.tooltip_id).hide().appendTo(document.body)/*.bind('click', handle)*/[0],
        header = $('<div>').attr('id',selector.tooltip_header_id).appendTo(node)[0],
        status = $('<div>').attr('id',selector.tooltip_status_id).appendTo(node)[0],
        details = $('<div>').attr('id',selector.tooltip_details_id).appendTo(node)[0],
        bzlist = $('<div>').attr('id',selector.tooltip_bugzilla_id).appendTo(node)[0];
        
        var
        content = {},
        myWidth = 0,
        
//        _render = function(conf) {
//            var
//            date = conf.date || '',
//            status = conf.date || '',
//            links = conf.date || '',
//            text = conf.date || '';
//            
//            
//        },
        _moveTo = function(elem) {
            myWidth = +$(node).css('width').replace(/[^\d\.]/g, '') / 2
            var 
            offset = $(elem).offset(),
            width = +$(elem).css('width').replace(/[^\d\.]/g, ''),
            height = +$(elem).css('height').replace(/[^\d\.]/g, '');
            $(node).css({
                top: (offset.top + height) + 'px',
                left: (offset.left + (width/2) - myWidth) + 'px'
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
            $(header).html(content.header)
            $(status).html(content.result)
            $(details).html(content.details)
            $(bzlist).html(links);
        },
        _edit = function(elem) {
            $(header).html('<a href="#">' + content.header + '</a>')
            $(status).html('<input type="radio" name="status" value="pass">pass<input type="radio" name="status" value="warn">warn<input type="radio" name="status" value="fail">fail')
            $(details).html('<textarea>' + content.details + '</textarea>')
            $(bzlist).html('input type="text" value="' + content.links.join(', ') + '">');
        };
        
        return {
            show: function(id, el){
                var col = el.className.replace(new RegExp('^.*?' + selector.table_cell_index_class + '(\\d+)', 'ig'), '$1');
                content = storage.data[id][col];
                content ? _view() : _edit();
//                _render(content)
                _moveTo(el);
                $(node).show();
            }
        }
    })(),
    
    _render = function(id) {
        var row = function(cols, cls, field) {
            var content = '', i = 0;
            while(i < cols)content += '<td class="' + cls + ' ' + selector.table_cell_index_class + i + '">' + storage.data[id][i++][field] + '</td>'
            return content
        },
        cols = storage.data[id].length,
        
        td_save = '<td class="' + selector.table_header_class + '"><input type="button" value="save" class="' + selector.button_save_class + '"></td>',
        td_date = '<td class="' + selector.table_date_class + '">Last check date</td>',
        td_result = '<td>Result</td>',
        
        html = ''
        + '<table><tbody><tr>'
        + td_save + row(cols, selector.table_header_class, 'header') + '</tr><tr>'
        + td_date + row(cols, selector.table_date_class, 'date') + '</tr><tr>'
        + td_result + row(cols, selector.table_result_class, 'result') + '</tr><tr>'
        + '</tr></table></tbody>';
        $(tables[id]).html(html);
    },
        
    _prepare = function(text){
        text = text
        .replace(/<script[\w\W]*?<\/script>/gim, '')    //delete all scripts
        .replace(/<head[\w\W]*?<\/head>/gim, '')        //delete head element
        .replace(/src\="/gim, 'source="');              //replace src attribute
        
//        var
//        script = new RegExp('\\n<script.*?id..' + selector.script_data_id.replace(/\-/g, '\\-') + '[\\w\\W]*$'),
//        divs = new RegExp('&lt;div[^>]*class..' + selector.table_class.replace(/\-/g, '\\-') + '.*?&gt;', 'gm'),
//        nl = '\n',
//        scriptText = ''
//            + nl + '&lt;!-- &lt;pre&gt; --&gt;'
//            + nl + '&lt;script id="' + selector.script_data_id + '" type="text/Javascript"&gt;'
//            + nl + '//&lt;!--'
//            + nl + 'WikiBox.set('+JSON.stringify(storage.data)+');'
//            + nl + '//--&gt;'
//            + nl + '&lt;/script&gt;'
//            + nl + '&lt;!-- &lt;pre&gt; --&gt;';
        
        var iframe = $('<div>').attr('id', selector.iframe_container_id).html(text)[0];
//        var i = 0;
//        $('#topic', iframe).html(
//            $('#topic', iframe).html()
//            .replace($(selector.script_data_id).length ? script : /$/, scriptText)
//            .replace(divs, function() {
//                return '&lt;div class="' + selector.table_class + '" id="' + tables[i++].id + '"&gt;'
//            })
//        )
        form = $('from[name="main"]', iframe).serialize().split('&');
    },
    
    _save = function(){
        StringifyData();
        SetTableIds();
        $.ajax({
            url: location.href.replace('view','save'),
            type: 'post',
            data: form.join('&'),
            success: function(){}
        })
    },
    
    handleTableClick = function(event) {
        var cls = event.target.className;
        cls.indexOf(selector.table_result_class)+1 && Tooltip.show(this.id, event.target);
        cls.indexOf(selector.button_save_class)+1 && _save();
    };
    
    return {
        init: function(){
            $.ajax({                        //get content of current page for _save
                url: location.href.replace('view','edit')
                    + '?t=' + Math.random().toString().substr(2,10)
                    + ';nowysiwyg=1',
                type: 'get',
                success: _prepare
            });
            var containers = $('.'+selector.table_class);
            if(!containers.length)return;       //no tables - nothing to do
            $(containers).each(function() {     //store existing ids and generate new
                if(!this.id) {
                    var id;                     //each id is ten-digit number
                    do {id = selector.table_id + Math.random().toString().substr(2,10)}
                    while(tables[id]);
                    this.id = id;
                    storage.raw(id)
                }
                tables[this.id] = this;
                $(this).bind('click', handleTableClick);
                storage.fill(this.id)      //fill tables with stored data
                _render(this.id);
            });
        },
        
        set: function(o){           //loads table contents from inline script
            $(o).each(function(){
                if (o.hasOwnProperty(this)) storage.data[this] = o[this]
            })
        }
    }
})();

$(document).ready(function() {
    WikiBox.init();
})