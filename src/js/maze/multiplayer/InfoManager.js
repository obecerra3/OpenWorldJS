define([], () =>
{
    var InfoManager =
    {
        addPlayerInfo: (_player, _display_class = false) =>
        {
            var info = document.getElementById("info");
            var p = document.createElement("p");
            p.innerHTML = _player.username;
            if (_display_class) p.style.color = _player.isHunted ? "blue" : "red";
            info.appendChild(p);
        },

        showPlayerClass: (_player, other_players) =>
        {
            var info = document.getElementById("info");
            info.innerHTML = "";
            var h3 = document.createElement("h3");
            h3.innerHTML = "Hunters: ";
            info.appendChild(h3);
            var hunted = _player;
            _player.isHunted = true;
            Object.values(other_players).forEach((other_player) =>
            {
                if (!other_player.isHunted)
                {
                    InfoManager.addPlayerInfo(other_player, true);
                } else
                {
                    hunted = other_player;
                    _player.isHunted = false;
                    InfoManager.addPlayerInfo(_player, true);
                }
            });
            var h3_ = document.createElement("h3");
            h3_.innerHTML = "Hunted: ";
            info.appendChild(h3_);
            InfoManager.addPlayerInfo(hunted, true);
        },

        playerLeft: (_player, _remaining_players) =>
        {
            info.innerHTML = "";
            InfoManager.addPlayerInfo(_player, false);
            _remaining_players.forEach((p)=>InfoManager.addPlayerInfo(p, false));
        }
    };
    return InfoManager;
});
