WikiBox = {

    Model: (function(){
        var Data = {
            ids:	{},
            arr:	[],
            list:	[],
			
            getlist: function() {}
        },
        Env = {
            targetBrowsers: {
                'ie6': 'Internet Explorer 6',
                'ie7': 'Internet Explorer 7',
                'ie8': 'Internet Explorer 8',
                'ff3': 'Mozilla Firefox 3',
                'ff4': 'Mozilla Firefox 4',
                'chr': 'Google Chrome',
                'saf': 'Apple Safari'
            },
            namespace: {
                'id_cont_prefix':   'wb-',
                'cl_cont':          'wikibox',
                'cl_username':      '',
                'cl_submit':        '',
                'cl_cell_header':   '',
                'cl_cell_date':     '',
                'cl_cell_status':   '',
                'cl_row_status':    ''
            }
        };
		
		
        return {
            getName: function(name) {
                return Env.namespace[name] || null;
            },
            getSaved: function() {
                return Data.getlist()
            },
            getNewId: function(qty){
                var id, created = [];
                while(qty--) {
                    id = this.getName('id_cont_prefix') 
                        + Math.round(Math.radom()*1000000000);
                    Data.ids[id] = {};
                    created.push(id);
                }
                return created
            },
            setNewId: function(arr) {
                for (var i=arr.length;i--;) {
                    Data.ids[arr[i]] = {};
                }
            },
            getCellData: function(id) {},
            getFullData: function(id) {}
        }
    })(),

    View: (function(){
        var 
        containers = {
            ids:	{},
            arr:	[],
            raw:	[],
            list:	[],
			
            getlist: function() {		// +++ checked
                return this.list || (function(o) {
                    for(var id in o.ids)o.list.push(id);
                    return o.list
                })(this)
            }
        };
        return {
            getContainers: function(name) {
                containers.arr = document.getElementsByClassName(name);
                var i, el;
                for(i=containers.arr.length;i--;) {
                    el = containers.arr[i]
                    el.id ? (containers.ids[el.id] = el)
                    : containers.raw.push(el);
                }
                return {
                    raw: containers.raw.length,
                    list: containers.getlist()
                }
            },
            setNewId: function(ids) {
                for(var i=ids.length;i--;)
                    containers.ids[ids[i]] = containers.raw[i];
            },
            getElementId: function(el, match) {
                return !match ? el.id && match.test(el.id) ?                 
                    el.id : this.getElementId(el.parentNode) : 1
            },
            tooltip: {
                
            }
        }
    })(),

    Controller: (function(){
	var 
        addEvents = function(el) {
            el.addEventListener('click', handleClick, false);
        },
        handleClick = function(event) {
            switch (event.target.className) {
                case Model.getName('cl_submit'):
                    saveChanges();
                    break;
                case Model.getName('cl_row_status'):
                    getTooltip(event.target);
                    break;
            }
        },
        saveChanges = function() {},
        editData = function(id) {
            
        },
        showData = function(id) {},
        getTooltip = function(cell) {
            var re = new RegExp('^'+Model.getName('id_cont_prefix')+'[\\d]+$/'),
            id = View.getElementId(cell, re),
            data = Model.getFullData(id);
            data ? showData() : editData()
            
        }
		
        return {
            init: function(){       // +++ almost done
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
            }
        }
    })()
}