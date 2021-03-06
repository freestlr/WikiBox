/* 
    Document   : wikibox.js
    Created on : 29.07.2011, 17:27:21
    Author     : alexey.kanischev
*/
var WikiBox = (function(){

//--------------------------------Global Methods------------------------------//
    String.prototype.wrap = function(str) {
        return str + this + (/<\w+[^>]*>/.test(str) ? str.replace(/<(\w+).*/,'</$1>') : str)
    };
    var toRequestString = function(obj) {
        var arr = [];
        for(var prop in obj)
            obj.hasOwnProperty(prop) &&
            arr.push(encodeURIComponent(prop)+'='+encodeURIComponent(obj[prop]))
        return arr.join('&')
    };
    HTMLFormElement.prototype.toObject = function() {
        var obj = {};
        for(var i = this.elements.length;i--;)
            this.elements[i].type == 'submit' ||
            (obj[this.elements[i].name] = this.elements[i].value)
        return obj
    }
    
//--------------------------------Variables-----------------------------------//
    var
    tables = {},
    form = {},
    currentUser = '',
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
        raw: function(id) {
            var data = this.data[id] = [];
            var cols = storage.defaults.browsers;
            $(cols).each(function() {
                data.push({
                    header: this+'',
                    date: '',
                    result: '',
                    links: '',
                    details: '',
                    user: ''
                })
            })
        }
    },
    selector = {
        sIdTable: 'wb-tbl-',
        sClassTable: 'wikibox',
        sClassTableHeader: 'wb-tbl-header',
        sClassTableDate: 'wb-tbl-date',
        sClassTableResult: 'wb-tbl-result',
        sClassCellIndex: 'wb-cell-',
        sClassCellSelected: 'wb-tbl-selected',
        
        sClassButtonSave: 'wb-btn-save',
        sIdIframeContainer: 'wb-edit-content',
        sIdScriptData: 'wb-script',
        
        sIdTooltip: 'wb-tooltip',
        sIdTooltipForm: 'wb-tt-form',
        sIdTooltipHeader: 'wb-tt-header',
        sIdTooltipResult: 'wb-tt-status',
        sIdTooltipDetails: 'wb-tt-details',
        sIdTooltipLinks: 'wb-tt-bzlist',
        sIdTooltipContainer: 'wb-tt-cont',

        sClassTooltipResultInput: 'wb-tt-st-input',
        sClassTooltipResultSelected: 'wb-tt-st-selected',
        sClassTooltipResultPass: 'wb-tt-st-pass',
        sClassTooltipResultWarn: 'wb-tt-st-warn',
        sClassTooltipResultFail: 'wb-tt-st-fail'
    };

//-----------------------------Tooltip Object---------------------------------//
    var Tooltip = {
        _moveTo : function(elem) {
            this.width = +this.node.css('width').replace(/[^\d\.]/g, '') / 2;
            this.width = this.width || 125;     //!!this is spike!!
            var 
            offset = $(elem).offset(),
            width = +$(elem).css('width').replace(/[^\d\.]/g, '');
//            height = +$(elem).css('height').replace(/[^\d\.]/g, '');
            this.node.css({
                top: (offset.top + /*(height*2)*/30) + 'px',
                left: (offset.left + (width/2) - this.width) + 'px'
            })
        },
        _view : function() {
            this.edit = false;
            var links = [], self = this;
            $(this.content.links.split(', ')).each(function() {
                links.push('<a target="_blank" href="http://tools.datasub.com/bugzilla/show_bug.cgi?id='+this+'">'+this+'</a>')
            })
            links = links.join(', ');
            this.header
            .html(this.content.header.wrap('<a href="javascript:;" title="Edit">'))
            .click(function(e) {
                e.stopPropagation();
                self._edit();
            });
            this.result
            .html(this.content.result.wrap('<div style="float: left" class="' + selector.sClassTooltipResultSelected + ' ' + selector['sClassTooltipResult' + this.content.result.slice(0,1).toUpperCase() + this.content.result.slice(1)] + '">')
                + ( ('By: '+this.content.user).wrap('<span>') + '<br/>'
                + ('Date: '+this.content.date).wrap('<span>') ).wrap('<div style="float: left; text-align: left">')
            )
            this.details
            .html(('Details:'.wrap('<legend style="font-family: monospace">') + this.content.details).wrap('<fieldset>'))
            .css('text-align', 'left')
            this.links
            .html('<br/>Bugzilla tickets: ' + links.replace(/,.$/,''))
            .css('text-align', 'left');
        },
        _edit : function() {
            this.edit = true;
            this.header.html(this.content.header)
            this.result.html(''
            + 'pass'.wrap('<div class="' + selector.sClassTooltipResultPass + '" name="result" value="pass">')
            + 'warn'.wrap('<div class="' + selector.sClassTooltipResultWarn + '" name="result" value="warn">')
            + 'fail'.wrap('<div class="' + selector.sClassTooltipResultFail + '" name="result" value="fail">')
            );
            this.details
            .html('<textarea name="details">' + (this.content.details || 'Issue details') + '</textarea>')
            .css('text-align', 'center');
            var width = $('textarea', this.details).css('width');
            $('textarea', this.details).css({'max-width': width, 'min-width': width});
            this.links
            .html('<input name="links" type="text" value="' + (this.content.links || 'Bugzilla tickets') + '">')
            .css('text-align', 'center');
            $([
                $('textarea', this.details)[0],
                $('input', this.links)[0]
            ]).focus(function() {this.value = ''})
        },
        
        init: function() {
            this.node    = $('<div>')   .attr('id', selector.sIdTooltip)         .appendTo(document.body);
            this.cvs     = $('<canvas>').attr({height: 10, width: 250})          .appendTo(this.node)[0].getContext('2d');
            this.cont    = $('<div>')   .attr('id', selector.sIdTooltipContainer).appendTo(this.node);
            this.form    = $('<form>')  .attr('id', selector.sIdTooltipForm)     .appendTo(this.cont);
            this.header  = $('<div>')   .attr('id', selector.sIdTooltipHeader)   .appendTo(this.form);
            this.result  = $('<div>')   .attr('id', selector.sIdTooltipResult)   .appendTo(this.form);
            this.details = $('<div>')   .attr('id', selector.sIdTooltipDetails)  .appendTo(this.form);
            this.links   = $('<div>')   .attr('id', selector.sIdTooltipLinks)    .appendTo(this.form);
            
            this.cvs.strokeStyle = '#66f';
            this.cvs.fillStyle = '#eef';
            this.cvs.moveTo(0,10);
            this.cvs.lineTo(110,10);
            this.cvs.lineTo(125,0);
            this.cvs.lineTo(125,1);
            this.cvs.lineTo(140,10);
            this.cvs.lineTo(251,10);
            this.cvs.stroke();
            this.cvs.fill();
            
            this.content = {};
            this.target  = {};
            this.width   = 0;
            this.node.hide();
        },
        show: function(id, el){
            if($(el).hasClass(selector.sClassCellSelected))return;
            this.node.bind('click', updateStatus);
            var col = el.className.replace(new RegExp('^.*?' + selector.sClassCellIndex + '(\\d+).*', 'ig'), '$1');
            var sel = selector.sClassCellSelected;
            $('.'+sel).removeClass(sel);
            $(el).addClass(sel);
            this.target = {
                date: $('.'+selector.sClassTableDate + '.'+selector.sClassCellIndex+col, tables[id]),
                result: el,
                id: id,
                col: col
            };
            this.content = storage.data[id][col];
            this.content.result ? this._view() : this._edit();
            this.updateStatus(this.content.result);
            this._moveTo(el);
            this.node.appendTo(el).show();
        },
        hide: function() {
            $('.'+selector.sClassCellSelected).removeClass(selector.sClassCellSelected);
            this.node/*.appendTo(document.body)*/.hide();
            this.target = {};
            this.content = {}
        },
        update: function() {
            if(!this.target.id || !this.edit)return;
            this.content.date = new Date().toISOString().replace(/[^\d-].*/, '');   // YYYY-MM-DD format
            this.content.user = currentUser;
            $.extend(this.content, this.form[0].toObject());
            this.content.links = this.content.links.replace(/^[\s,]*(.*)[\s,]*$/, '$1').split(/\D+/).join(', ');
            
            storage.data[this.target.id][this.target.col] = this.content;
            $(this.target.date).html(this.content.date);
            $(this.target.result).html(this.content.result);
        },
        updateStatus: function(res) {
            this.content.result = res;
            var sel = selector.sClassTooltipResultSelected;
            this.details.show();
            this.links.show();
            $('.'+sel).removeClass(sel);

            switch (res) {
                case '':
                case 'pass':        //if status is ok - not showing details && links
                    this.details.hide();
                case 'warn':        //in case of warning - not showing links to bugzilla only
                    this.links.hide();
                case 'fail':        //if test fails - we fill all fields
                    break
                }
                $('.'+selector['sClassTooltipResult' + res.slice(0,1).toUpperCase() + res.slice(1)]).addClass(sel);
            return
        }
    };
    Tooltip.init();
 
//----------------------------Private Methods---------------------------------//
    var
    _draw = function() {
        for(var id in storage.data) _render(id);
    },
    _render = function(id) {
        var row = function(cols, cls, field) {
            var content = '', i = 0;
            while(i < cols)content += '<td class="' + cls + ' ' + selector.sClassCellIndex + i + '">' + storage.data[id][i++][field] + '</td>'
            return content
        },
        cols = storage.data[id].length,
        
        td_save = '<td class="' + selector.sClassTableHeader + '"><input type="button" value="save" class="' + selector.sClassButtonSave + '"></td>',
        td_date = '<td class="' + selector.sClassTableDate + '">Check date</td>',
        td_result = '<td>Result</td>',
        
        html = ''
        + '<table><tbody>'
        + (td_save + row(cols, selector.sClassTableHeader, 'header')).wrap('<tr>')
        + (td_date + row(cols, selector.sClassTableDate, 'date')).wrap('<tr>')
        + (td_result + row(cols, selector.sClassTableResult, 'result')).wrap('<tr>')
        + '</table></tbody>';
        $(tables[id]).html(html);
    },
        
    _prepare = function(text){
        text = text
        .replace(/<head[\w\W]*?<\/head>/gim, '')        //delete head element
        .replace(/<script[\w\W]*?<\/script>/gim, '')    //delete all scripts
        .replace(/src\="/gim, 'source="');              //replace src attribute
        var iframe = $('<div>').attr('id', selector.sIdIframeContainer).html(text)[0];
        form = $('form[name="main"]', iframe);
        if (!form.length) {form = null; return}
        form = form[0].toObject();
        currentUser = form.sig.replace(/[^\.]*\.(\w+).*/,'$1');
    },
    
    _save = function(button){
        Tooltip.update();
        if (form === null) {alert('You cannot edit this topic'); return}
        $(button).css('background-color', '#aaf');
        var nl = '\n', ns = '--', arrId = [], id,
        reTables = new RegExp('<div[^>]*class..'+selector.sClassTable.replace(/\-/g,'.')+'.*?>', 'mig'),
        reScript = new RegExp('\n[^\n]*\n<script[^>]*id..'+selector.sIdScriptData.replace(/\-/g,'.')+'[\\w\\W]*$', 'mig'),
        strScript = ''
            + nl + '<!'+ns+' <pre> '+ns+'>'
            + nl + '<script id="' + selector.sIdScriptData + '" type="text/Javascript">'
            + nl + '//<!'+ns
            + nl + '$(document).ready(function(){WikiBox.set('+JSON.stringify(storage.data)+')});'
            + nl + '//'+ns+'>'
            + nl + '</script>'
            + nl + '<!'+ns+' <pre> '+ns+'>';
        for(id in tables)arrId.push(id);
        form.text = form.text
        .replace($('#'+selector.sIdScriptData).length ? reScript : /$/, strScript)
        .replace(reTables, function() {
            return '<div class="' + selector.sClassTable + '" id="' + arrId.shift() + '">'
        })
        $.ajax({
            url: location.href.replace('view','save'),
            type: 'post',
            data: toRequestString(form),
            success: function(txt){
                $(button).css('background-color', '#f1f1f1');
            }
        })
    },
    
//---------------------------Event Handlers-----------------------------------//
    handleTableClick = function(event) {
        var el = event.target;
        if ($(el).hasClass(selector.sClassTableResult)) Tooltip.show($(el).parents('.'+selector.sClassTable)[0].id, el);
        if ($(el).hasClass(selector.sClassButtonSave)) _save(el);
    },
    hideTooltip = function(event) {
        var el = $(event.target), sel = selector.sClassCellSelected;
        if (el.hasClass(sel) || el.parents('.'+sel).length) return;
        if (Tooltip.content.result) Tooltip.update();
        Tooltip.hide();
    },
    updateStatus = function(event) {
        var el = $(event.target);
        if(!el.attr('name') || !el.parents('#'+selector.sIdTooltipResult).length)return;
        Tooltip.updateStatus(el.attr('value'))
    };
    
//---------------------------Public Methods-----------------------------------//
    return {
        init: function(){
            $.ajax({                        //get content of current page for _save
                url: location.href.replace(/#.*/, '').replace('view','edit')
                    + '?t=' + Math.random().toString().substr(2,10)
                    + ';nowysiwyg=1',
                type: 'get',
                success: _prepare
            });
            var containers = $('.'+selector.sClassTable);
            if(!containers.length)return;       //no tables - nothing to do
            $(containers).each(function() {     //store existing ids and generate new
                if(!this.id) {
                    var id;                     //each id is ten-digit number
                    do {id = selector.sIdTable + Math.random().toString().substr(2,10)}
                    while(storage.data[id]);
                    this.id = id;
                    storage.raw(id)
                }
                tables[this.id] = this;
            });
 
            $(window).bind('click', hideTooltip);
            $(window).bind('click', handleTableClick);

            if(!$('#'+selector.sIdScriptData).length)_draw()
        },
        
        set: function(saved){           //loads table contents from inline script
            $.extend(storage.data, saved)
            _draw();
        }
    }
})();

$(document).ready(WikiBox.init);