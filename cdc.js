if(!window.cdc){
// namespace
//
  window.cdc = {};

// configure library to use as a singleton - not strictly required
//
  cdc.initialize = function(){
    var options = arguments[0] || {};
    var role = options.role;
    if(role == 'server'){ cdc.instance = new cdc.server(options) }
    if(role == 'client'){ cdc.instance = new cdc.client(options) }
    return(cdc.instance);
  };

  cdc.send = function(message){
    return cdc.instance.send(message);
  };

  cdc.recv = function(callback){
    return cdc.instance.recv(callback);
  };

// servant class - base for server/client
//
  cdc.servant = function(){
    var options = arguments[0] || {};
    var methods = cdc.servant.prototype;
    var instance = this;

    instance.role = options.role;
    instance.target = options.target;
    instance.src = cdc.src_for(options.src);
    instance.timeout = options.timeout || 100;
    instance.callbacks = [];

    methods.send = function(message){
      var instance = this;
      var msg = encodeURIComponent(message);
      instance.target.location = instance.src + '#' + msg;
      return(instance);
    };

    methods.recv = function(callback){
      var instance = this;
      instance.callbacks.push(callback);
      instance.poll();
      return(instance);
    };

    methods.poll = function(){
      var instance = this;
      if(instance.polling){ return };

      var iframe = instance.find_target_iframe();

      if(iframe){
        instance.polling = true;
        var poll = function(){
          var hash = iframe.location.hash;
          if(poll.hash != hash){
            poll.hash = hash;
            var message = (''+hash).replace(/^#/, '');
            var blank = /^\s*$/;
            if(!blank.test(message)){
              message = decodeURIComponent(message);
              for(var i = 0; i < instance.callbacks.length; i++){
                var callback = instance.callbacks[i];
                callback(message);
              }
            }
          }
        };
        poll.hash = undefined;
        setInterval(poll, instance.timeout);
      }
    };

    methods.find_target_iframe = function(){
      var instance = this;
      var iframe = null;
      if(instance.role == 'server'){
        var domain = document.domain;
        try{ iframe = instance.target.frames[domain] } catch(e){};
      }
      if(instance.role == 'client'){
        iframe = window;
      }
      return(iframe);
    };
  };

// server class
//
  cdc.server = cdc.servant;

// client class
//
  cdc.client = cdc.servant;

// utils
//
  cdc.src_for = function(url){
    url = '' + url;
    var parts = url.split(/#/);
    var src = parts.shift();
    return(src);
  };

  cdc.log = function(msg){
    try{ console.log(msg) } catch(e){ alert(msg) }
  };
};
