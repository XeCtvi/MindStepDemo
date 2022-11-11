import { _decorator, Component, Prefab, instantiate, Node, CCInteger, Vec3 } from 'cc';
import { PlayerController } from './PlayController';
const { ccclass, property } = _decorator;

// 赛道格子类型，坑（BT_NONE）或者实路（BT_STONE）
enum BlockType {
    BT_NONE,
    BT_STONE,
};

enum GameState {
    GS_INIT, // 显示游戏菜单，初始化一些资源。
    GS_PLAYING, // 隐藏游戏菜单，玩家可以操作角色进行游戏
    GS_END, // 游戏结束，显示结束菜单
}

@ccclass("GameManager")
export class GameManager extends Component {

    // 引用 `PlayerController` 脚本，关联 Player 节点身上 PlayerController 组件
    @property({ type: PlayerController })
    public playerCtrl: PlayerController | null = null;

    // 主界面根节点：为了动态地开启/关闭开始菜单，引用 StartMenu 节点
    @property({ type: Node }) // 2D 组件
    public startMenu: Node | null = null;

    // 赛道预制
    @property({type: Prefab})
    public cubePrfb: Prefab | null = null;
    // 赛道长度
    @property
    public roadLength = 50;
    private _road: BlockType[] = [];

    start () {
        // this.generateRoad();
        this.curState = GameState.GS_INIT;
        // ?. 可选链写法
        this.playerCtrl?.node.on('JumpEnd', this.onPlayerJumpEnd, this); // 监听角色跳跃消息，并调用判断函数
    }

    init() {
        // 激活主界面
        if (this.startMenu) {
            this.startMenu.active = true;
        }
        // 生成赛道
        this.generateRoad();
        if(this.playerCtrl){
            // 禁止接收用户操作人物移动指令
            this.playerCtrl.setInputActive(false);
            // 重置人物位置
            this.playerCtrl.node.setPosition(Vec3.ZERO);
            // 重置已经移动的步长数据
            this.playerCtrl.reset();
        }
    }

    set curState (value: GameState) {
        switch(value) {
            case GameState.GS_INIT:
                this.init();
                break;
            case GameState.GS_PLAYING:
                if (this.startMenu) {
                    this.startMenu.active = false;
                }
                // 设置 active 为 true 时会直接开始监听鼠标事件，此时鼠标抬起事件还未派发
                // 会出现的现象就是，游戏开始的瞬间人物已经开始移动
                // 因此，这里需要做延迟处理
                setTimeout(() => {
                    if (this.playerCtrl) {
                        this.playerCtrl.setInputActive(true);
                    }
                }, 0.1);
                break;
            case GameState.GS_END:
                break;
        }
    }

    generateRoad() {
        // 防止游戏重新开始时，赛道还是旧的赛道
        // 因此，需要移除旧赛道，清除旧赛道数据
        this.node.removeAllChildren();
        this._road = [];
        // 确保游戏运行时，人物一定站在实路上
        this._road.push(BlockType.BT_STONE);

        // 确定好每一格赛道类型
        for (let i = 1; i < this.roadLength; i++) {
            // 如果上一格赛道是坑，那么这一格一定不能为坑
            if (this._road[i-1] === BlockType.BT_NONE) {
                this._road.push(BlockType.BT_STONE);
            } else {
                this._road.push(Math.floor(Math.random() * 2));
            }
        }

        // 根据赛道类型生成赛道
        for (let j = 0; j < this._road.length; j++) {
            let block: Node = this.spawnBlockByType(this._road[j]);
            // 判断是否生成了道路，因为 spawnBlockByType 有可能返回坑（值为 null）
            if (block) {
                this.node.addChild(block);
                block.setPosition(j, -1.5, 0);
            }
        }
    }

    // 根据赛道类型生成赛道
    spawnBlockByType(type: BlockType) {
        if (!this.cubePrfb) {
            return null;
        }

        let block: Node | null = null;
        // 赛道类型为实路才生成
        switch(type) {
            case BlockType.BT_STONE:
                block = instantiate(this.cubePrfb);
                break;
        }

        return block;
    }

    onStartButtonClicked() {
        // 点击主界面 play 按钮，开始游戏
        this.curState = GameState.GS_PLAYING;
    }

    // 判断输赢
    checkResult(moveIndex: number) {
        console.log("moveIndex: ", moveIndex, "roadLength: ", this.roadLength, "BlockType: ", this._road[moveIndex]);
        if (moveIndex < this.roadLength) {
            // 跳到了坑里
            if (this._road[moveIndex] == BlockType.BT_NONE) {
                this.curState = GameState.GS_INIT;
            }
        } else {  // 跳过了最大长度
            this.curState = GameState.GS_INIT;
        }
    }

    onPlayerJumpEnd(moveIndex: number) {
        this.checkResult(moveIndex);
    }

    // update (deltaTime: number) {
    //     // Your update function goes here.
    // }
}
