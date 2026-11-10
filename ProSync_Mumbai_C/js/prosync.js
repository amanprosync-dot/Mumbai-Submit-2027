(function(){
  document.querySelectorAll('a[data-pass]').forEach(function(link){
    link.addEventListener('click',function(){var select=document.getElementById('passSelect');if(select)select.value=this.getAttribute('data-pass');});
  });
  var f=document.getElementById('interestForm');
  if(f)f.addEventListener('submit',function(ev){
    ev.preventDefault();if(!f.reportValidity())return;
    var d=new FormData(f);
    var subject='Grand E-Commerce AI Summit Mumbai 2027 — Pass Enquiry';
    var body=['Hello ProSync Team,','I would like to enquire about a summit ticket.','','Name: '+d.get('name'),'Email: '+d.get('email'),'Phone: '+d.get('phone'),'Pass: '+d.get('pass'),'Event: 16 January 2027, Radisson Mumbai Andheri MIDC'].join('\n');
    document.getElementById('regMessage').textContent='Your email app will open with this enquiry. No booking or payment has been made yet.';
    location.href='mailto:support@prosyncedu.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
  });
})();
