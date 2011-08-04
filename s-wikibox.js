/* 
    Document   : wikibox.js
    Created on : 29.07.2011, 17:27:21
    Author     : alexey.kanischev
*/
var WikiBox = (function(){
    String.prototype.wrap = function(str) {
        return str + this + (/<\w+[^>]*>/.test(str) ? str.replace(/<(\w+).*/,'</$1>') : str)
    };
    String.prototype.has = function(str) {
        return this.indexOf(str)+1 ? this : ''
    }
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
        table_cell_selected_class: 'wb-tbl-selected',
        
        script_data_id: 'wb-script',
        button_save_class: 'wb-btn-save',
        iframe_container_id: 'wb-edit-content',
        
        sClassTableResultPass: 'wb-tt-pass',
        sClassTableResultWarn: 'wb-tt-warn',
        sClassTableResultFail: 'wb-tt-fail',
        tooltip_id: 'wb-tooltip',
        tooltip_header_id: 'wb-tt-header',
        tooltip_status_id: 'wb-tt-status',
        tooltip_details_id: 'wb-tt-details',
        tooltip_bugzilla_id: 'wb-tt-bzlist'
    };
    
    var Tooltip = {
        _moveTo : function(elem) {
            this.width = +this.node.css('width').replace(/[^\d\.]/g, '') / 2
            var 
            offset = $(elem).offset(),
            width = +$(elem).css('width').replace(/[^\d\.]/g, ''),
            height = +$(elem).css('height').replace(/[^\d\.]/g, '');
            this.node.css({
                top: (offset.top + (height*2)) + 'px',
                left: (offset.left + (width/2) - this.width) + 'px'
            })
        },
        _bzLink : function(link) {
            return '<a target="_blank" href="http://tools.datasub.com/bugzilla/show_bug.cgi?id='+link+'">'+link+'</a>'
        },
        _view : function(elem) {
            var links = '', self = this;
            $(this.content.links).each(function() {
                links += self._bzLink(this) + ', '
            })
            this.header.html(this.content.header)
            this.result.html(this.content.result)
            this.details.html(this.content.details)
            this.links.html(links);
        },
        _edit : function(elem) {
            this.header.html(this.content.header)
//            this.result.html('<input type="radio" name="result" value="pass">pass<input type="radio" name="result" value="warn">warn<input type="radio" name="result" value="fail">fail')
            this.result.html(''
            + '<div class="' + selector.sClassTableResultPass + '" name="result" value="pass">pass</div>'
            + '<div class="' + selector.sClassTableResultWarn + '" name="result" value="warn">warn</div>'
            + '<div class="' + selector.sClassTableResultFail + '" name="result" value="fail">fail</div>'
            );
            this.details.html('<textarea name="details">' + (this.content.details || 'Issue details') + '</textarea>');
            this.links.html('<input name="links" type="text" value="' + (this.content.links.join(', ') || 'Bugzilla tickets') + '">');
        },
        
        init: function() {
            this.node = $('<div>').attr('id',selector.tooltip_id).hide().appendTo(document.body);
            this.header = $('<div>').attr('id',selector.tooltip_header_id).appendTo(this.node[0]);
            this.result = $('<div>').attr('id',selector.tooltip_status_id).appendTo(this.node[0]);
            this.details = $('<div>').attr('id',selector.tooltip_details_id).appendTo(this.node[0]);
            this.links = $('<div>').attr('id',selector.tooltip_bugzilla_id).appendTo(this.node[0]);
            this.content = {};
            this.target = {};
            this.width = 0;
        },
        show: function(id, el){
            var col = el.className.replace(new RegExp('^.*?' + selector.table_cell_index_class + '(\\d+).*', 'ig'), '$1');
            $('.'+selector.table_cell_selected_class).removeClass(selector.table_cell_selected_class);
            $(el).addClass(selector.table_cell_selected_class);
            this.target = {id: id, col: col};
            this.content = storage.data[id][col];
            this.content.result ? this._view() : this._edit();
            this._moveTo(el);
            this.node.appendTo(el).show();
        },
        update: function(hide) {
            if (this.node.parent('.'+selector.table_cell_selected_class).length && this.content.result) {
                this.node.appendTo(document.body);
                this.content.date = new Date().toISOString().replace(/[^\d-].*/, '');
                storage.data[this.target.id][this.target.col] = this.content;
                
                $('.'+selector.table_date_class+'.'+selector.table_cell_index_class+this.target.col, tables[this.target.id]).html(this.content.date)
                $('.'+selector.table_result_class+'.'+selector.table_cell_index_class+this.target.col, tables[this.target.id]).html(this.content.result)
            }
            hide && this.node.hide()
        },
        save: function(field, value) {
            this.content[field] = field == 'links' ? value.split(/\D+/) : value;
            console.log(field+': '+value)
        },
        status: function(st) {
            switch (st) {
                case 'pass':
                    
                    break;
                case 'warn':
                    
                    break;
                case 'fail':
                    
                    break;
                default:
                    
                    break;
            }
        }
    };
    Tooltip.init();
    
    var
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
        var el = event.target;
        $(el).hasClass(selector.table_result_class) && Tooltip.show(this.id, event.target);
        $(el).hasClass(selector.button_save_class) && _save();
    },
    hideTooltip = function(event) {
        var sel = selector.table_cell_selected_class;
        if($(event.target).hasClass(sel) ||
            $(event.target).parents('.'+sel).length) return;
        Tooltip.update(!$(event.target).hasClass(selector.table_result_class))
    },
    changeTooltip = function(event) {
        var el = event.target;
        if(!$(el).attr('name'))return;
        $(el).parent('#'+selector.tooltip_status_id).length && Tooltip.status($(el).attr('value'))
        Tooltip.save($(el).attr('name'), $(el).attr('value') || $(el).text())
    };
    
    return {
        init: function(){
            $.ajax({                        //get content of current page for _save
                url: location.href.replace(/#.*/, '').replace('view','edit')
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
                storage.fill(this.id)      //fill tables with stored data
                _render(this.id);
            });
            $('.'+selector.table_class).bind('click', handleTableClick);
            $(window).bind('click', hideTooltip);
            Tooltip.node.bind('click', changeTooltip)
            Tooltip.node.bind('keypress', changeTooltip)
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