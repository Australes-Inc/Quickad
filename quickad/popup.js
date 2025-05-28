document.addEventListener('DOMContentLoaded', function() {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusDiv = document.getElementById('status');
  
  console.log('Popup chargé');
  
  function updateUI(enabled) {
    console.log('Mise à jour UI:', enabled);
    if (enabled) {
      toggleSwitch.classList.add('active');
      statusDiv.className = 'status enabled';
      statusDiv.textContent = 'Quickad activé';
    } else {
      toggleSwitch.classList.remove('active');
      statusDiv.className = 'status disabled';
      statusDiv.textContent = 'Quickad désactivé';
    }
  }
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    
    if (!currentTab || !currentTab.url || !currentTab.url.includes('youtube.com')) {
      statusDiv.className = 'status disabled';
      statusDiv.textContent = 'Disponible uniquement sur YouTube';
      toggleSwitch.style.pointerEvents = 'none';
      toggleSwitch.style.opacity = '0.5';
      return;
    }
    
    console.log('Sur YouTube, envoi du message getStatus');
    
    const timeoutId = setTimeout(() => {
      console.warn('Timeout - script de contenu probablement pas chargé');
      updateUI(true); 
    }, 2000);
    
    chrome.tabs.sendMessage(currentTab.id, {action: 'getStatus'}, function(response) {
      clearTimeout(timeoutId);
      
      if (chrome.runtime.lastError) {
        setTimeout(() => {
          chrome.tabs.sendMessage(currentTab.id, {action: 'getStatus'}, function(response) {
            if (chrome.runtime.lastError) {
              updateUI(true); 
            } else if (response) {
              updateUI(response.enabled);
            } else {
              updateUI(true);
            }
          });
        }, 1500);
      } else if (response) {
        updateUI(response.enabled);
      } else {
        updateUI(true); 
      }
    });
  });
  
  toggleSwitch.addEventListener('click', function() {
    console.log('Clic sur toggle');
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      
      if (!currentTab || !currentTab.url || !currentTab.url.includes('youtube.com')) {
        return;
      }
      
      chrome.tabs.sendMessage(currentTab.id, {action: 'toggle'}, function(response) {
        if (chrome.runtime.lastError) {
        } else if (response) {
          updateUI(response.enabled);
        }
      });
    });
  });
});